import {Module} from '@nestjs/common'

import {WhatsappBaileysProvider} from './whatsapp-baileys.provider'
import {WhatsappBaileysService} from './whatsapp-baileys.service'

@Module({
  providers: [WhatsappBaileysProvider, WhatsappBaileysService],
  exports: [WhatsappBaileysService],
})
export class WhatsappBaileysModule {}
