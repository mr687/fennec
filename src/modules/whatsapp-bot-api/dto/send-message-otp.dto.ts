import { IsDefined, IsNumber, IsPhoneNumber, IsPositive, IsString, Max } from 'class-validator'
import {
  SendMessageOtpDto as BaileysSendMessageOtpDto,
  WhatsappBaileysSessionId,
} from 'src/modules/whatsapp-bot-api/providers/whatsapp-baileys'

export class SendMessageOtpDto implements BaileysSendMessageOtpDto {
  @IsDefined()
  sessionId: WhatsappBaileysSessionId

  @IsString()
  @IsPhoneNumber('ID')
  receiver: string

  @IsNumber()
  @IsPositive()
  @Max(999999)
  code: number
}
