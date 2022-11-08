import { APP_FILTER } from '@nestjs/core'
import { AppService } from './app.service'
import { HttpErrorFilter } from './shared'
import { Module } from '@nestjs/common'
import { WhatsappBotApiModule } from './modules/whatsapp-bot-api'

@Module({
  imports: [WhatsappBotApiModule],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpErrorFilter,
    },
  ],
})
export class AppModule {}
