import { Module } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'

import { AppService } from './app.service'
import { registerBull, registerEnv, registerMongoose } from './config'
import { AuthModule } from './modules/auth/auth.module'
import { ChatBotModule } from './modules/chat-bot/chatbot.module'
import { HttpInterceptor } from './modules/logger/interceptors'
import { HttpErrorFilter } from './shared'

@Module({
  imports: [
    registerEnv(),
    registerMongoose(),
    registerBull(),
    // registerCache(),
    // registerThrottle(),
    AuthModule,
    ChatBotModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpErrorFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpInterceptor,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}
