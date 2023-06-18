import {IsString, MaxLength} from 'class-validator'

import {LoginSessionDto as BaileysLoginSessionDto} from '@/providers/whatsapp-baileys'

export class LoginSessionDto implements BaileysLoginSessionDto {
  @IsString()
  @MaxLength(20)
  sessionId: string
}
