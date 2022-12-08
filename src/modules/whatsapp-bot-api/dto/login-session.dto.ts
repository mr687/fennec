import { IsPhoneNumber, IsString, MaxLength, maxLength } from 'class-validator'
import { LoginSessionDto as BaileysLoginSessionDto } from 'src/modules/whatsapp-bot-api/providers/whatsapp-baileys'

export class LoginSessionDto implements BaileysLoginSessionDto {
  @IsString()
  @MaxLength(20)
  sessionName: string
}
