import {BullModule} from '@nestjs/bull'
import {Module} from '@nestjs/common'
import {MongooseModule} from '@nestjs/mongoose'

import {WhatsappBaileysModule} from '@/providers/whatsapp-baileys/whatsapp-baileys.module'

import {ChatBotSession, ChatBotSessionSchema} from './chatbot-session.schema'
import {ChatBotController} from './chatbot.controller'
import {ChatBotProcessor} from './chatbot.processor'
import {ChatBotService} from './chatbot.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: ChatBotSession.name, schema: ChatBotSessionSchema},
    ]),
    BullModule.registerQueue({
      name: 'chat-bot',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    WhatsappBaileysModule,
  ],
  controllers: [ChatBotController],
  providers: [ChatBotService, ChatBotProcessor],
  exports: [ChatBotService],
})
export class ChatBotModule {}
