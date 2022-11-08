import {
  CheckPhoneNumberDto,
  LoginSessionDto,
  ResponseSendMessageDto,
  SendMessageTextDto,
  WhatsappBaileysError,
  WhatsappBaileysSession,
  WhatsappBaileysSessionId,
  WhatsappBaileysSessionStatus,
} from './whatsapp-baileys.dto'
import { AnyMessageContent } from '@adiwajshing/baileys'
import { Injectable } from '@nestjs/common'
import { ServiceContract } from 'src/shared'
import { WhatsappBaileysProvider } from './whatsapp-baileys.provider'
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
    params.phone = params.phone.replace(/\D/g, '')
    const result = await this.whatsappProvider.createSession(params.phone)

    this.endSessionOnReady(result.id, result.status)

    return result
  }

  public async checkPhoneNumber(params: CheckPhoneNumberDto): Promise<boolean> {
    const { phone } = params

    const phoneNumberFormatted = formatPhoneNumber(phone)
    const [result] = await this.session.onWhatsApp(phoneNumberFormatted)

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

    console.log('phonesk', phoneNumberFormatted, isPhoneNumberOnWhatsapp)

    const messageContent: AnyMessageContent = {
      text: message,
    }
    await this.session.sendMessage(phoneNumberFormatted, messageContent)

    this.endSessionOnReady(sessionId)

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
    const session = await this.whatsappProvider.getSession(sessionId)

    if (!session) {
      throw new Error(WhatsappBaileysError.NO_SESSION_ERROR)
    }

    this.session = session
  }
}
