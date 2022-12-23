import { AnyMessageContent } from '@adiwajshing/baileys'
import { ForbiddenException, Injectable } from '@nestjs/common'

import { ServiceContract, delay, delayWithCallback } from 'src/shared'

import {
  CheckPhoneNumberDto,
  LoginSessionDto,
  ResponseSendMessageDto,
  SendMessageTextDto,
  WhatsappBaileysError,
  WhatsappBaileysSessionId,
  WhatsappBaileysSessionStatus,
} from './whatsapp-baileys.dto'
import { WhatsappBaileysProvider } from './whatsapp-baileys.provider'
import { WhatsappBaileysSession } from './whatsapp-baileys.session'
import { formatPhoneNumber } from './whatsapp-baileys.util'

interface IWhatsapp {
  sendTextMessage(params: SendMessageTextDto): Promise<ResponseSendMessageDto>
  checkPhoneNumber(params: CheckPhoneNumberDto): Promise<boolean>
}

@Injectable()
export class WhatsappBaileysService extends ServiceContract implements IWhatsapp {
  protected session: WhatsappBaileysSession
  protected name: string = WhatsappBaileysService.name

  public constructor(protected whatsappProvider: WhatsappBaileysProvider) {
    super()
  }

  public async getStatus(
    sessionId: WhatsappBaileysSessionId,
  ): Promise<Omit<WhatsappBaileysSession, 'socket' | 'syncData'>> {
    const session = this.whatsappProvider.getSession(sessionId)
    if (!session) {
      return {
        id: sessionId,
        connected: false,
      }
    }
    return {
      id: session.id,
      status: session.status,
      connected: session.connected ?? false,
      qr: session.qr,
      isNew: session.isNew,
      user: session.user,
    }
  }

  public async newSession(sessionId: WhatsappBaileysSessionId) {
    const retryable = async (retry = true): Promise<any> => {
      const result = await this.whatsappProvider.createSession(sessionId)
      if (retry && result.status === WhatsappBaileysSessionStatus.SESSION_LOGGED_OUT_ERROR) {
        retry = false
        return retryable(retry)
      }
      return result
    }

    const result = await retryable()

    // this.endSessionOnReady(result.id, result.status)

    return result
  }

  public async checkPhoneNumber(params: CheckPhoneNumberDto): Promise<boolean> {
    const { phone } = params

    const phoneNumberFormatted = formatPhoneNumber(phone)
    const [result] = await this.session.socket.onWhatsApp(phoneNumberFormatted)

    return result?.exists ?? false
  }

  public async sendTextMessage(params: SendMessageTextDto): Promise<ResponseSendMessageDto> {
    const { receiver, content, sessionId } = params

    await this.syncSession(sessionId)

    const phoneNumberFormatted = formatPhoneNumber(receiver)

    const isPhoneNumberOnWhatsapp = await this.checkPhoneNumber({
      phone: phoneNumberFormatted,
    })

    if (!isPhoneNumberOnWhatsapp) {
      throw new Error(WhatsappBaileysError.PHONE_NUMBER_NOT_EXISTS_ERROR)
    }

    await this.session.socket.presenceSubscribe(phoneNumberFormatted)
    await delay(500)

    await this.session.socket.sendPresenceUpdate('composing', phoneNumberFormatted)
    await delay(1000)

    await this.session.socket.sendPresenceUpdate('paused', phoneNumberFormatted)

    const messageContent: AnyMessageContent = {
      text: content,
    }
    await this.session.socket.sendMessage(phoneNumberFormatted, messageContent)

    // this.endSessionOnReady(sessionId)

    return {
      status: true,
      receiver,
      message: content,
    }
  }

  public async sendMessage(params: any): Promise<ResponseSendMessageDto> {
    const { receiver, content, sessionId } = params

    await this.syncSession(sessionId)

    const phoneNumberFormatted = formatPhoneNumber(receiver)

    const isPhoneNumberOnWhatsapp = await this.checkPhoneNumber({
      phone: phoneNumberFormatted,
    })

    if (!isPhoneNumberOnWhatsapp) {
      throw new Error(WhatsappBaileysError.PHONE_NUMBER_NOT_EXISTS_ERROR)
    }

    await this.session.socket.presenceSubscribe(phoneNumberFormatted)
    await delay(500)

    await this.session.socket.sendPresenceUpdate('composing', phoneNumberFormatted)
    await delay(1000)

    await this.session.socket.sendPresenceUpdate('paused', phoneNumberFormatted)

    const newMessage = await this.session.socket.sendMessage(phoneNumberFormatted, content)

    await this.session.socket.sendReceipt(phoneNumberFormatted, undefined, [newMessage?.key?.id!], 'read')

    // this.endSessionOnReady(sessionId)

    return {
      status: true,
      receiver,
      message: newMessage as any,
    }
  }

  protected endSessionOnReady(sessionId: WhatsappBaileysSessionId, status?: WhatsappBaileysSessionStatus) {
    if (!status) {
      return this.whatsappProvider.endSession(sessionId)
    }

    if (status === WhatsappBaileysSessionStatus.READY) {
      return this.whatsappProvider.endSession(sessionId)
    }
  }

  protected async syncSession(sessionId: WhatsappBaileysSessionId) {
    const session = await this.whatsappProvider.getSessionOrReconnect(sessionId)

    if (!session) {
      throw new ForbiddenException(WhatsappBaileysError.NO_SESSION_ERROR)
    }

    this.session = session
  }
}
