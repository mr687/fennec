import { existsSync } from 'fs'

import { Boom } from '@hapi/boom'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectConnection } from '@nestjs/mongoose'
import makeWASocket, {
  Browsers,
  Contact,
  DisconnectReason,
  UserFacingSocketConfig,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys'
import { useMongoConversation } from 'baileys-conversation'
import { Connection } from 'mongoose'
import { toDataURL } from 'qrcode'

import { LoggerService } from 'src/modules/logger/logger.service'
import { ProviderContract, delayWithCallback, stringToBase64 } from 'src/shared'

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
  private _retries: Map<WhatsappBaileysSessionId, number> = new Map()
  private _sessions: Map<WhatsappBaileysSessionId, WhatsappBaileysSession> = new Map()

  public constructor(
    private readonly configService: ConfigService,
    private readonly log: LoggerService,
    @InjectConnection() private readonly connection: Connection,
  ) {
    super({
      SESSION_PATH: configService.get<string>('WA_SESSION_PATH', 'storage/whatsapp-sessions'),
      STORE_PATH: configService.get<string>('WA_STORE_PATH', 'storage/whatsapp-stores'),
      MAX_RETRIES: configService.get<number>('WA_MAX_RETRIES', 1),
      QR_PRINT_TO_TERMINAL: configService.get<boolean>('WA_QR_PRINT_TO_TERMINAL', false),
      QR_TIMEOUT: configService.get<number>('QR_TIMEOUT', 60e3),
      RECONNECT_INTERVAL: configService.get<number>('WA_RECONNECT_INTERVAL', 3e3),
    })
    this.log.setContext(WhatsappBaileysProvider.name)
  }

  public async createSessionWithDelay(
    sessionId: WhatsappBaileysSessionId,
    ms = 1000,
    onSessionCreated?: (session: WhatsappBaileysSession) => Promise<void>,
  ) {
    const createSessionCallback = this.createSession.bind(this, sessionId, onSessionCreated)

    this.log.debug(`[${sessionId}] Reconnecting in ${ms} ms`)

    return delayWithCallback(ms, createSessionCallback)
  }

  public async createSession(
    sessionId: WhatsappBaileysSessionId,
    onSessionCreated?: (session: WhatsappBaileysSession) => Promise<void>,
  ) {
    const sessionFilepath = this.resolveSessionPath(sessionId)

    const { state, saveCreds } = await useMultiFileAuthState(sessionFilepath)

    // fetch latest version of WA Web
    const { version, isLatest } = await fetchLatestBaileysVersion()
    this.log.debug(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

    const options: UserFacingSocketConfig = {
      ...this.getDefaultSocketConfig(),
      auth: state,
      version,
    }

    const socket = makeWASocket(options)
    const conversation = useMongoConversation(this.connection, {
      ignoreMessage: message => {
        const content = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
        return /(kode\sotp|your\sotp|terima\skasih\ssudah\sberbelanja)/gi.test(content)
      },
    })

    await socket.waitForSocketOpen()
    conversation.binding(socket)

    this.log.debug('Socket opened!')

    this.setSession(sessionId, { socket, id: sessionId })
    this.log.debug(`[${sessionId}] Session saved!`)

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
            this.log.debug(`[${sessionId}] New login: ${isNewLogin}`)
            const newSession = this.getSession(sessionId)
            if (newSession) {
              newSession.isNew = true
              this.setSession(sessionId, newSession)
            }
          }

          switch (connection) {
            case 'open':
              this.log.debug(`[${sessionId}] Connection opened`)

              this._retries.delete(sessionId)

              const session = this.getSession(sessionId)
              if (session && session.isNew) {
                session.isNew = false
                session.qr = undefined
                session.connected = true
                session.status = WhatsappBaileysSessionStatus.READY
                session.user = await this.resolveUserSession(socket)
                this.setSession(sessionId, session)
                // delayWithCallback(2000, this.endSession.bind(this, sessionId))

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
              this.log.debug(`[${sessionId}] Connection closed`)

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
              this.log.debug(`[${sessionId}] Connecting..`)
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

            this.log.debug(`[${sessionId}] Scan QR required!`)

            const qrCodeUrl = await toDataURL(qr)
            const session = this.getSession(sessionId)
            if (session) {
              session.status = WhatsappBaileysSessionStatus.SCAN_QR
              session.connected = false
              session.qr = {
                type: 'base64',
                data: qrCodeUrl,
              }
              this.setSession(sessionId, session)
            }

            return resolve({
              id: sessionId,
              status: WhatsappBaileysSessionStatus.SCAN_QR,
              connected: false,
              // qr: {
              //   type: 'base64',
              //   data: qrCodeUrl,
              // },
            })
          }
        } catch (e) {
          console.error(e)
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

    const sessionFilepath = this.resolveSessionPath(sessionId)

    if (!existsSync(sessionFilepath)) {
      this.log.debug(`Session path: ${sessionFilepath} is not exists.`)
      return
    }

    const result = await this.createSession(sessionId)

    if (!result.connected || result.status !== WhatsappBaileysSessionStatus.READY) {
      return
    }

    return this.getSession(sessionId)
  }

  public endSession(sessionId: WhatsappBaileysSessionId): void {
    this.log.debug(`[${sessionId}] End session`)
    const session = this.getSession(sessionId)

    if (!session) {
      return
    }

    this._sessions.delete(sessionId)
    this.log.debug(`[${sessionId}] Session ended!`)

    delayWithCallback(2000, () => {
      session.socket.end(
        new Boom('Session saved and closed.', {
          statusCode: parseInt(WhatsappBaileysError.SESSION_END_ERROR.toString()),
        }),
      )
    })
  }

  public deleteSession(sessionId: WhatsappBaileysSessionId): void {
    // const sessionFilepath = this.resolveSessionPath(sessionId)

    // const options = { force: true, recursive: true }
    // rmSync(sessionFilepath, options)

    this._sessions.delete(sessionId)
    this._retries.delete(sessionId)

    this.log.debug(`[${sessionId}] Session deleted!`)
  }

  public shouldReconnect(sessionId: WhatsappBaileysSessionId): boolean {
    const maxRetries = this.config.MAX_RETRIES
    let attempts = this._retries.get(sessionId) ?? 0

    if (attempts < maxRetries) {
      ++attempts

      this.log.debug(`[${sessionId}] Reconnect Required. Attempts: ${attempts}/${maxRetries}`)
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

  protected getDefaultSocketConfig(): Partial<UserFacingSocketConfig> {
    return {
      // logger: this.log,
      printQRInTerminal: this.config.QR_PRINT_TO_TERMINAL,
      browser: Browsers.appropriate('Chrome'),
      qrTimeout: this.config.QR_TIMEOUT,
    }
  }

  protected resolveSessionPath(sessionId: WhatsappBaileysSessionId) {
    const sessionEncoded = stringToBase64(sessionId.toString())
    const filenameFormat = 'md_{session_encode}_session'
    const filename = filenameFormat.replace('{session_encode}', sessionEncoded)
    const filepath = this.getSessionPath(filename)

    return filepath
  }

  protected getSessionPath(filename: string): string {
    const basePath = this.config.SESSION_PATH
    const sessionPath = basePath.concat('/', filename)

    return sessionPath
  }
}
