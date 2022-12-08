import {
  IWhatsappBaileysSession,
  WhatsappBaileysConfig,
  WhatsappBaileysError,
  WhatsappBaileysSessionId,
  WhatsappBaileysSessionStatus,
  WhatsappBaileysSocket,
} from './whatsapp-baileys.dto'
import { ProviderContract, delayWithCallback, stringToBase64 } from 'src/shared'
import { existsSync, rmSync } from 'fs'
import makeWASocket, {
  Browsers,
  DisconnectReason,
  MessageRetryMap,
  UserFacingSocketConfig,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  Contact,
} from '@adiwajshing/baileys'
import { Boom } from '@hapi/boom'
import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import { WhatsappBaileysSession } from './whatsapp-baileys.session'
import { toDataURL } from 'qrcode'

@Injectable()
export class WhatsappBaileysProvider extends ProviderContract<WhatsappBaileysConfig> {
  protected name: string = WhatsappBaileysProvider.name

  private _retries: Map<WhatsappBaileysSessionId, number> = new Map()
  private _sessions: Map<WhatsappBaileysSessionId, WhatsappBaileysSession> = new Map()
  private _msgRetryCounterMap: MessageRetryMap = {}

  public constructor(private envService: ConfigService) {
    super({
      SESSION_PATH: envService.get<string>('WA_SESSION_PATH', 'storage/whatsapp-sessions'),
      STORE_PATH: envService.get<string>('WA_STORE_PATH', 'storage/whatsapp-stores'),
      MAX_RETRIES: envService.get<number>('WA_MAX_RETRIES', 1),
      QR_TIMEOUT: envService.get<number>('WA_QR_TIMEOUT', 30e3),
      QR_PRINT_TO_TERMINAL: envService.get<boolean>('WA_QR_PRINT_TO_TERMINAL', false),
      RECONNECT_INTERVAL: envService.get<number>('WA_RECONNECT_INTERVAL', 3e3),
    })
  }

  public async createSessionWithDelay(sessionId: WhatsappBaileysSessionId, ms = 1000) {
    const createSessionCallback = this.createSession.bind(this, sessionId)

    this.log.debug(`[${sessionId}] Reconnecting in ${ms} ms`)

    return delayWithCallback(ms, createSessionCallback)
  }

  public async createSession(sessionId: WhatsappBaileysSessionId) {
    const sessionFilepath = this.resolveSessionPath(sessionId)

    const { state, saveCreds } = await useMultiFileAuthState(sessionFilepath)

    // fetch latest version of WA Web
    const { version, isLatest } = await fetchLatestBaileysVersion()
    this.log.info(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

    const options: UserFacingSocketConfig = {
      ...this.getDefaultSocketConfig(),
      auth: state,
      version,
      msgRetryCounterMap: this._msgRetryCounterMap,
    }

    const socket = makeWASocket(options)

    await socket.waitForSocketOpen()

    this.log.debug('Socket opened!')

    this.setSession(sessionId, { socket })
    this.log.debug(`[${sessionId}] Session saved!`)

    socket.ev.on('creds.update', saveCreds)

    return new Promise<{
      id: WhatsappBaileysSessionId
      connected: boolean
      status: WhatsappBaileysSessionStatus
      user?: Contact
      qr?: { type: 'base64'; data: string; timeout: number }
    }>(resolve => {
      socket.ev.on('connection.update', async update => {
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
              this.setSession(sessionId, session)
              delayWithCallback(2000, this.endSession.bind(this, sessionId))
            }

            return resolve({
              id: sessionId,
              status: WhatsappBaileysSessionStatus.READY,
              connected: true,
              user: await this.resolveUserSession(socket),
            })
          case 'close':
            this.log.debug(`[${sessionId}] Connection closed`)

            if (isSessionEnd) {
              return resolve({
                id: sessionId,
                status: WhatsappBaileysSessionStatus.READY,
                connected: true,
                user: await this.resolveUserSession(socket),
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

            return this.createSessionWithDelay(sessionId, reconnectInterval)
          case 'connecting':
          default:
            this.log.debug(`[${sessionId}] Connecting..`)
            break
        }

        if (qr) {
          this.log.debug(`[${sessionId}] Scan QR required!`)

          const qrCodeUrl = await toDataURL(qr)

          return resolve({
            id: sessionId,
            status: WhatsappBaileysSessionStatus.SCAN_QR,
            connected: false,
            qr: {
              type: 'base64',
              timeout: this.config.QR_TIMEOUT,
              data: qrCodeUrl,
            },
          })
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

    this.log.debug(`[${sessionId}] Session ended!`)

    session.socket.end(
      new Boom('Session saved and closed.', {
        statusCode: parseInt(WhatsappBaileysError.SESSION_END_ERROR.toString()),
      }),
    )
  }

  public deleteSession(sessionId: WhatsappBaileysSessionId): void {
    const sessionFilepath = this.resolveSessionPath(sessionId)

    const options = { force: true, recursive: true }
    rmSync(sessionFilepath, options)

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
      logger: this.log,
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
