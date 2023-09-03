import { Module } from '@nestjs/common'

import { registerMongooseFeature } from '@/core/config'
import { registerBullQueue } from '@/core/config/bull.config'
import { WhatsappBaileysModule } from '@/providers/whatsapp-baileys/whatsapp-baileys.module'

import { ChatBotSession, ChatBotSessionSchema } from './chatbot-session.schema'
import { ChatBotController } from './chatbot.controller'
import { CHATBOT_QUEUE_NAME, ChatBotProcessor } from './chatbot.processor'
import { ChatBotService } from './chatbot.service'

@Module({
  imports: [
    registerMongooseFeature(ChatBotSession.name, ChatBotSessionSchema),
    registerBullQueue(CHATBOT_QUEUE_NAME),
    WhatsappBaileysModule,
  ],
  controllers: [ChatBotController],
  providers: [ChatBotService, ChatBotProcessor],
  exports: [ChatBotService],
})
export class ChatBotModule {}
