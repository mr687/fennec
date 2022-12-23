import { IsPhoneNumber, IsString, MaxLength, maxLength } from 'class-validator'

import { LoginSessionDto as BaileysLoginSessionDto } from 'src/modules/chat-bot/providers/whatsapp-baileys'

export class LoginSessionDto implements BaileysLoginSessionDto {
  @IsString()
  @MaxLength(20)
  sessionId: string
}
