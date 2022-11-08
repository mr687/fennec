import {
  LoginSessionDto as BaileysLoginSessionDto,
  SendMessageOtpDto as BaileysSendMessageOtpDto,
} from 'src/providers/whatsapp-baileys'
import { IsNumber, IsPhoneNumber, IsPositive, IsString, Max } from 'class-validator'

export class LoginSessionDto implements BaileysLoginSessionDto {
  @IsString()
  @IsPhoneNumber('ID')
  phone: string
}

export class SendMessageOtpDto implements BaileysSendMessageOtpDto {
  @IsString()
  @IsPhoneNumber('ID')
  receiver: string

  @IsNumber()
  @IsPositive()
  @Max(999999)
  code: number
}
