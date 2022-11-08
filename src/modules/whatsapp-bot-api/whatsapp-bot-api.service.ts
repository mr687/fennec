import { LoginSessionDto, SendMessageOtpDto, WhatsappBaileysService } from 'src/providers/whatsapp-baileys'
import { Injectable } from '@nestjs/common'
import { ServiceContract } from 'src/shared'

@Injectable()
export class WhatsappBotApiService extends ServiceContract {
  public constructor(protected whatsappBaileysService: WhatsappBaileysService) {
    super()
  }

  public async loginSession(params: LoginSessionDto) {
    const result = await this.whatsappBaileysService.newSession(params)
    return result
  }

  public async sendMessageOtp(params: SendMessageOtpDto) {
    const { receiver, code } = params
    const sessionId = '6282325441718'

    const MessageOTPFormat = 'Your OTP code is {code}.\nPLEASE DO NOT SHARE THIS OTP WITH ANYONE!'

    const message = MessageOTPFormat.replace('{code}', code.toString())

    const result = await this.whatsappBaileysService.sendTextMessage({
      sessionId,
      receiver,
      message,
    })
    return result
  }
}
