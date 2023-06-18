import {Module} from '@nestjs/common'

import {registerLogger} from '@/core/config'

import {WhatsappBaileysProvider} from './whatsapp-baileys.provider'
import {WhatsappBaileysService} from './whatsapp-baileys.service'

@Module({
  imports: [registerLogger()],
  providers: [WhatsappBaileysProvider, WhatsappBaileysService],
  exports: [WhatsappBaileysService],
})
export class WhatsappBaileysModule {}
