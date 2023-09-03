import { existsSync } from 'fs'

import { Boom } from '@hapi/boom'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import makeWASocket, {
  Browsers,
  Contact,
  DisconnectReason,
  UserFacingSocketConfig,
  WAMessageContent,
  WAMessageKey,
  fetchLatestBaileysVersion,
  isJidUser,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  proto,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys'
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino'

import { ProviderContract } from '@/shared/contracts'
import { delayWithCallback, stringToBase64 } from '@/shared/utils'

import {
  IWhatsappBaileysSession,
  WhatsappBaileysConfig,
  WhatsappBaileysError,
  WhatsappBaileysSessionId,
  WhatsappBaileysSessionStatus,
  WhatsappBaileysSocket,
} from './whatsapp-baileys.dto'
import { WhatsappBaileysSession } from './whatsapp-baileys.session'

@Injectable()
export class WhatsappBaileysProvider extends ProviderContract<WhatsappBaileysConfig> {
  private readonly _logger = new Logger(WhatsappBaileysProvider.name)
  private _retries: Map<WhatsappBaileysSessionId, number> = new Map()
  private _sessions: Map<WhatsappBaileysSessionId, WhatsappBaileysSession> = new Map()
  private _store: ReturnType<typeof makeInMemoryStore> | null

  public constructor(
    configService: ConfigService,
    @InjectPinoLogger(WhatsappBaileysProvider.name)
    private readonly _pinoLogger: PinoLogger,
  ) {
    super({
      SESSION_PATH: configService.get<string>('WA_SESSION_PATH', 'storage/whatsapp-sessions'),
      STORE_PATH: configService.get<string>('WA_STORE_PATH', 'storage/whatsapp-stores'),
      MAX_RETRIES: configService.get<number>('WA_MAX_RETRIES', 5),
      QR_PRINT_TO_TERMINAL: configService.get<boolean>('WA_QR_PRINT_TO_TERMINAL', true),
      QR_TIMEOUT: configService.get<number>('QR_TIMEOUT', 60_000),
      RECONNECT_INTERVAL: configService.get<number>('WA_RECONNECT_INTERVAL', 3_000),
    })
  }

  public async createSessionWithDelay(
    sessionId: WhatsappBaileysSessionId,
    ms = 1000,
    onSessionCreated?: (session: WhatsappBaileysSession) => Promise<void>,
  ) {
    const createSessionCallback = this.createSession.bind(this, sessionId, onSessionCreated)
    this._logger.debug(`[${sessionId}] Reconnecting in ${ms} ms`)
    return delayWithCallback(ms, createSessionCallback)
  }

  public async createSession(
    sessionId: WhatsappBaileysSessionId,
    onSessionCreated?: (session: WhatsappBaileysSession) => Promise<void>,
  ) {
    const { filepath: sessionFilepath, filename: sessionFilename } = this._resolveSessionPath(sessionId)
    const { state, saveCreds } = await useMultiFileAuthState(sessionFilepath)
    // fetch latest version of WA Web
    const { version, isLatest } = await fetchLatestBaileysVersion()
    this._logger.debug(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

    const options: UserFacingSocketConfig = this._getSocketConfig({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, this._pinoLogger.logger),
      },
      version: version,
    })
    const socket = makeWASocket(options)

    // if (!this._store) {
    //   const storeFilepath = path.join(this.config.STORE_PATH, `${sessionFilename}.json`)
    //   this._store = makeInMemoryStore({ logger: this._pinoLogger.logger })
    //   this._store.readFromFile(storeFilepath)
    //   setInterval(() => this._store!.writeToFile(storeFilepath), 10_000)
    // }
    // this._store.bind(socket.ev)

    await socket.waitForSocketOpen()
    this._logger.debug('Socket opened!')

    this.setSession(sessionId, { socket, id: sessionId })
    this._logger.debug(`[${sessionId}] Session saved!`)

    socket.ev.on('creds.update', saveCreds)

    return new Promise<{
      id: WhatsappBaileysSessionId
      connected: boolean
      status: WhatsappBaileysSessionStatus
      user?: Contact
      qr?: { type: 'base64'; data: string }
    }>(resolve => {
      socket.ev.on('connection.update', async update => {
        try {
          const { connection, lastDisconnect, qr, isNewLogin } = update
          const statusCode: DisconnectReason = (lastDisconnect?.error as Boom)?.output?.statusCode
          const isLoggedOut = statusCode === DisconnectReason.loggedOut
          const isRestartRequired = statusCode === DisconnectReason.restartRequired
          const isConnectionClosed = statusCode === DisconnectReason.connectionClosed
          const isSessionEnd = (statusCode as any) === WhatsappBaileysError.SESSION_END_ERROR

          const reconnectInterval = isRestartRequired ? 0 : this.config.RECONNECT_INTERVAL

          let isShouldReconnect

          if (isNewLogin) {
            this._logger.debug(`[${sessionId}] New login: ${isNewLogin}`)
            const newSession = this.getSession(sessionId)
            if (newSession) {
              newSession.isNew = true
              this.setSession(sessionId, newSession)
            }
          }

          switch (connection) {
            case 'open':
              this._logger.debug(`[${sessionId}] Connection opened`)

              this._retries.delete(sessionId)

              const session = this.getSession(sessionId)
              if (session && session.isNew) {
                session.isNew = false
                session.qr = undefined
                session.connected = true
                session.status = WhatsappBaileysSessionStatus.READY
                session.user = await this.resolveUserSession(socket)
                this.setSession(sessionId, session)

                if (onSessionCreated) {
                  await onSessionCreated(session)
                }
              }

              return resolve({
                id: sessionId,
                status: WhatsappBaileysSessionStatus.READY,
                connected: true,
                user: session!.user,
              })
            case 'close':
              this._logger.debug(`[${sessionId}] Connection closed`)

              if (isSessionEnd) {
                return resolve({
                  id: sessionId,
                  status: WhatsappBaileysSessionStatus.READY,
                  connected: true,
                })
              }

              isShouldReconnect = this.shouldReconnect(sessionId)

              if (isConnectionClosed || isLoggedOut || !isShouldReconnect) {
                this.deleteSession(sessionId)
                return resolve({
                  id: sessionId,
                  status: WhatsappBaileysSessionStatus.SESSION_LOGGED_OUT_ERROR,
                  connected: false,
                })
              }

              return this.createSessionWithDelay(sessionId, reconnectInterval, onSessionCreated)
            case 'connecting':
            default:
              this._logger.debug(`[${sessionId}] Connecting..`)
              break
          }

          if (qr) {
            isShouldReconnect = this.shouldReconnect(sessionId)

            if (!isShouldReconnect) {
              this.deleteSession(sessionId)
              return resolve({
                id: sessionId,
                status: WhatsappBaileysSessionStatus.SESSION_LOGGED_OUT_ERROR,
                connected: false,
              })
            }

            this._logger.debug(`[${sessionId}] Scan QR required!`)

            const session = this.getSession(sessionId)
            if (session) {
              session.status = WhatsappBaileysSessionStatus.SCAN_QR
              session.connected = false
              session.qr = {
                type: 'base64',
                data: qr,
              }
              this.setSession(sessionId, session)
            }
            return resolve({
              id: sessionId,
              status: WhatsappBaileysSessionStatus.SCAN_QR,
              connected: false,
            })
          }
        } catch (e) {
          this._logger.error(e)
        }
      })
    })
  }

  public getSession(sessionId: WhatsappBaileysSessionId): WhatsappBaileysSession | undefined {
    const runningSession = this._sessions.get(sessionId)
    if (!runningSession) {
      return
    }
    return runningSession
  }

  public async getSessionOrReconnect(sessionId: WhatsappBaileysSessionId): Promise<WhatsappBaileysSession | undefined> {
    const session = this.getSession(sessionId)
    if (session) {
      return session
    }

    const { filepath: sessionFilepath } = this._resolveSessionPath(sessionId)

    if (!existsSync(sessionFilepath)) {
      this._logger.debug(`Session path: ${sessionFilepath} is not exists.`)
      return
    }

    const result = await this.createSession(sessionId)

    if (!result.connected || result.status !== WhatsappBaileysSessionStatus.READY) {
      return
    }

    return this.getSession(sessionId)
  }

  public endSession(sessionId: WhatsappBaileysSessionId): void {
    this._logger.debug(`[${sessionId}] End session`)
    const session = this.getSession(sessionId)

    if (!session) {
      return
    }

    this._sessions.delete(sessionId)
    this._logger.debug(`[${sessionId}] Session ended!`)

    delayWithCallback(2000, () => {
      session.socket.end(
        new Boom('Session saved and closed.', {
          statusCode: parseInt(WhatsappBaileysError.SESSION_END_ERROR.toString()),
        }),
      )
    })
  }

  public deleteSession(sessionId: WhatsappBaileysSessionId): void {
    this._sessions.delete(sessionId)
    this._retries.delete(sessionId)

    this._logger.debug(`[${sessionId}] Session deleted!`)
  }

  public shouldReconnect(sessionId: WhatsappBaileysSessionId): boolean {
    const maxRetries = this.config.MAX_RETRIES
    let attempts = this._retries.get(sessionId) ?? 0
    if (attempts < maxRetries) {
      ++attempts
      this._logger.debug(`[${sessionId}] Reconnect Required. Attempts: ${attempts}/${maxRetries}`)
      this._retries.set(sessionId, attempts)
      return true
    }
    return false
  }

  protected setSession(sessionId: WhatsappBaileysSessionId, data: Partial<IWhatsappBaileysSession>) {
    const { socket } = data
    if (!socket) {
      return
    }
    let session = this.getSession(sessionId)
    if (!session) {
      session = new WhatsappBaileysSession(data as IWhatsappBaileysSession)
      this._sessions.set(sessionId, session)
    }

    session.syncData(data as IWhatsappBaileysSession)
    this._sessions.set(sessionId, session)
  }

  protected async resolveUserSession(socket: WhatsappBaileysSocket) {
    const user = socket.user
    return {
      id: user?.id!,
      name: user?.name!,
      notify: user?.notify!,
      verifiedName: user?.verifiedName!,
      imgUrl: user?.imgUrl ?? (await socket.profilePictureUrl(user!.id, 'image')),
      status: user?.status ?? (await socket.fetchStatus(user?.id!))?.status,
    }
  }

  private _getSocketConfig<C extends Pick<UserFacingSocketConfig, 'auth'> & Partial<UserFacingSocketConfig>>(
    config: C,
  ): UserFacingSocketConfig {
    return {
      logger: this._pinoLogger.logger,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      shouldIgnoreJid: jid => !isJidUser(jid),
      getMessage: key => this._handleMessageUpdates(key),
      printQRInTerminal: this.config.QR_PRINT_TO_TERMINAL,
      browser: Browsers.macOS('Chrome'),
      qrTimeout: this.config.QR_TIMEOUT,
      ...config,
    }
  }

  private async _handleMessageUpdates(key: WAMessageKey): Promise<WAMessageContent | undefined> {
    if (this._store) {
      const msg = await this._store.loadMessage(key.remoteJid!, key.id!)
      return msg?.message || undefined
    }
    return proto.Message.fromObject({})
  }

  private _resolveSessionPath(sessionId: WhatsappBaileysSessionId) {
    const sessionEncoded = stringToBase64(sessionId.toString())
    const filenameFormat = 'md_{session_encode}_session'
    const filename = filenameFormat.replace('{session_encode}', sessionEncoded)
    const filepath = this._getSessionPath(filename)
    return { filename, filepath }
  }

  private _getSessionPath(filename: string): string {
    const basePath = this.config.SESSION_PATH
    const sessionPath = basePath.concat('/', filename)
    return sessionPath
  }
}
