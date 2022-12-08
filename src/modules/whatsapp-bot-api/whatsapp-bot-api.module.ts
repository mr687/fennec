import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { WhatsappBaileysModule } from 'src/modules/whatsapp-bot-api/providers/whatsapp-baileys'
import { WhatsappBotApiController } from './whatsapp-bot-api.controller'
import { WhatsappBotApiProcessor } from './whatsapp-bot-api.processor'
import { WhatsappSession, WhatsappSessionSchema } from './whatsapp-bot-api.schema'
import { WhatsappBotApiService } from './whatsapp-bot-api.service'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WhatsappSession.name, schema: WhatsappSessionSchema }]),
    BullModule.registerQueue({
      name: 'whatsapp',
    }),
    WhatsappBaileysModule,
  ],
  controllers: [WhatsappBotApiController],
  providers: [WhatsappBotApiService, WhatsappBotApiProcessor],
  exports: [WhatsappBotApiService],
})
export class WhatsappBotApiModule {}
