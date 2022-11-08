import { ProviderContract, delayWithCallback, stringToBase64 } from 'src/shared'
import {
  WhatsappBaileysConfig,
  WhatsappBaileysError,
  WhatsappBaileysSession,
  WhatsappBaileysSessionId,
  WhatsappBaileysSessionStatus,
} from './whatsapp-baileys.dto'
import { existsSync, rmSync } from 'fs'
import makeWASocket, {
  Browsers,
  DisconnectReason,
  UserFacingSocketConfig,
  useMultiFileAuthState,
} from '@adiwajshing/baileys'
import { Boom } from '@hapi/boom'
import { Injectable } from '@nestjs/common'
import { toDataURL } from 'qrcode'

@Injectable()
export class WhatsappBaileysProvider extends ProviderContract<WhatsappBaileysConfig> {
  protected name: string = WhatsappBaileysProvider.name

  private _retries: Map<WhatsappBaileysSessionId, number> = new Map()
  private _sessions: Map<WhatsappBaileysSessionId, WhatsappBaileysSession> = new Map()

  public constructor() {
    super({
      SESSION_PATH: 'storage/whatsapp-sessions',
      STORE_PATH: 'storage/whatsapp-stores',
      MAX_RETRIES: 1,
      QR_TIMEOUT: 30e3,
      RECONNECT_INTERVAL: 3e3,
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

    const options: UserFacingSocketConfig = {
      ...this.getDefaultSocketConfig(),
      auth: state,
    }

    const socket = makeWASocket(options)

    await socket.waitForSocketOpen()

    socket.ev.on('creds.update', saveCreds)

    return new Promise<{
      id: WhatsappBaileysSessionId
      connected: boolean
      status: WhatsappBaileysSessionStatus
      qr?: { type: 'base64'; data: string; timeout: number }
    }>(resolve => {
      socket.ev.on('connection.update', async update => {
        const { connection, lastDisconnect, qr } = update

        const statusCode: DisconnectReason = (lastDisconnect?.error as Boom)?.output?.statusCode

        const isLoggedOut = statusCode === DisconnectReason.loggedOut
        const isRestartRequired = statusCode === DisconnectReason.restartRequired
        const isSessionEnd = (statusCode as any) === WhatsappBaileysError.SESSION_END_ERROR

        const reconnectInterval = isRestartRequired ? 0 : this.config.RECONNECT_INTERVAL

        let isShouldReconnect

        switch (connection) {
          case 'open':
            this.log.debug(`[${sessionId}] Connection opened`)

            this._sessions.set(sessionId, { ...socket })
            this._retries.delete(sessionId)

            return resolve({
              id: sessionId,
              status: WhatsappBaileysSessionStatus.READY,
              connected: true,
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

            if (isLoggedOut || !isShouldReconnect) {
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

  public async getSession(sessionId: WhatsappBaileysSessionId): Promise<WhatsappBaileysSession | undefined> {
    const sessionFilepath = this.resolveSessionPath(sessionId)

    if (!existsSync(sessionFilepath)) {
      return
    }

    const result = await this.createSession(sessionId)

    if (!result.connected || result.status !== WhatsappBaileysSessionStatus.READY) {
      return
    }

    return this._sessions.get(sessionId)
  }

  public endSession(sessionId: WhatsappBaileysSessionId): void {
    const session = this._sessions.get(sessionId)

    if (!session) {
      return
    }

    session.end(
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
  }

  public shouldReconnect(sessionId: WhatsappBaileysSessionId): boolean {
    const maxRetries = this.config.MAX_RETRIES
    let attempts = this._retries.get(sessionId) ?? 0

    if (attempts < maxRetries) {
      ++attempts

      this._retries.set(sessionId, attempts)

      return true
    }

    return false
  }

  protected getDefaultSocketConfig(): Partial<UserFacingSocketConfig> {
    return {
      logger: this.log,
      printQRInTerminal: false,
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
