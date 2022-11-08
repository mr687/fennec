import { Module } from '@nestjs/common'
import { WhatsappBaileysModule } from 'src/providers/whatsapp-baileys'
import { WhatsappBotApiController } from './whatsapp-bot-api.controller'
import { WhatsappBotApiService } from './whatsapp-bot-api.service'

@Module({
  imports: [WhatsappBaileysModule],
  controllers: [WhatsappBotApiController],
  providers: [WhatsappBotApiService],
  exports: [WhatsappBotApiService],
})
export class WhatsappBotApiModule {}
