import {
  CheckPhoneNumberDto,
  LoginSessionDto,
  ResponseSendMessageDto,
  SendMessageTextDto,
  WhatsappBaileysError,
  WhatsappBaileysSessionId,
  WhatsappBaileysSessionStatus,
} from './whatsapp-baileys.dto'
import { ServiceContract, delay, delayWithCallback } from 'src/shared'
import { AnyMessageContent } from '@adiwajshing/baileys'
import { ForbiddenException, Injectable } from '@nestjs/common'
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

  public constructor(protected whatsappProvider: WhatsappBaileysProvider) {
    super()
  }

  public async newSession(params: LoginSessionDto) {
    const retryable = async (retry = true): Promise<any> => {
      const result = await this.whatsappProvider.createSession(params.sessionName)
      if (retry && result.status === WhatsappBaileysSessionStatus.SESSION_LOGGED_OUT_ERROR) {
        retry = false
        return retryable(retry)
      }
      return result
    }

    const result = await retryable()

    this.endSessionOnReady(result.id, result.status)

    return result
  }

  public async checkPhoneNumber(params: CheckPhoneNumberDto): Promise<boolean> {
    const { phone } = params

    const phoneNumberFormatted = formatPhoneNumber(phone)
    const [result] = await this.session.socket.onWhatsApp(phoneNumberFormatted)

    return result?.exists ?? false
  }

  public async sendTextMessage(params: SendMessageTextDto): Promise<ResponseSendMessageDto> {
    const { receiver, message, sessionId } = params

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
      text: message,
    }
    await this.session.socket.sendMessage(phoneNumberFormatted, messageContent)

    delayWithCallback(2000, this.endSessionOnReady.bind(this, sessionId))

    return {
      status: true,
      receiver,
      message,
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
