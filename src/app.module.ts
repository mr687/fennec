import { Module } from '@nestjs/common'

import { CoreModule } from './core/core.module'
import { AuthModule } from './modules/auth/auth.module'
import { ChatBotModule } from './modules/chat-bot/chatbot.module'

@Module({
  imports: [CoreModule, AuthModule, ChatBotModule],
})
export class AppModule {}
