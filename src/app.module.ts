import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { AppService } from './app.service'
import { AuthModule } from './modules/auth/auth.module'
import { HttpErrorFilter } from './shared'
import { LoggerModule } from 'nestjs-pino'
import { Module } from '@nestjs/common'

import { MongooseModule } from '@nestjs/mongoose'
import { BullModule } from '@nestjs/bull'
import { WhatsappBotApiModule } from './modules/whatsapp-bot-api/whatsapp-bot-api.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      expandVariables: true,
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          redis: {
            host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
            port: configService.get<number>('REDIS_PORT', 6379),
            username: configService.get<string>('REDIS_USERNAME'),
            password: configService.get<string>('REDIS_PASSWORD'),
          },
        }
      },
    }),
    // CacheModule.registerAsync({
    //   isGlobal: true,
    //   useFactory: async (configService: ConfigService) => {
    //     const store = await redisStore({
    //       socket: {
    //         host: configService.get('REDIS_HOST'),
    //         port: configService.get('REDIS_PORT'),
    //       },
    //       username: configService.get('REDIS_USERNAME'),
    //       password: configService.get('REDIS_PASSWORD'),
    //     })
    //     return {
    //       store: {
    //         create: () => store,
    //       },
    //     }
    //   },
    //   inject: [ConfigService],
    // }),
    // ThrottlerModule.forRoot({
    //   ttl: 60,
    //   limit: 10,
    //   // storage: new ThrottlerStorageRedisService()
    // }),
    LoggerModule.forRoot(),
    AuthModule,
    WhatsappBotApiModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpErrorFilter,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}
