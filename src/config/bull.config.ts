import { BullModule } from '@nestjs/bull'
import { ConfigService } from '@nestjs/config'

export const registerBull = () =>
  BullModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      redis: {
        host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
        port: configService.get<number>('REDIS_PORT', 6379),
        username: configService.get<string>('REDIS_USERNAME'),
        password: configService.get<string>('REDIS_PASSWORD'),
      },
    }),
  })
