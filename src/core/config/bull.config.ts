import { BullModule } from '@nestjs/bull'
import { ConfigService } from '@nestjs/config'

export const registerBullQueue = (name: string) => BullModule.registerQueue({ name: name })

export const registerBull = () =>
  BullModule.forRootAsync({
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      prefix: configService.get<string>('REDIS_PREFIX', 'nestjs-bull'),
      defaultJobOptions: {
        removeOnComplete: configService.get<string>('NODE_ENV', 'development') === 'production',
        removeOnFail: false,
        delay: 1000,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
      limiter: {
        max: configService.get<number>('BULL_MAX', 1000),
        duration: configService.get<number>('BULL_DURATION', 5000),
        bounceBack: configService.get<string>('BULL_BOUNCE_BACK', 'true') === 'true',
      },
      redis: {
        host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
        port: configService.get<number>('REDIS_PORT', 6379),
        username: configService.get<string>('REDIS_USERNAME', 'default'),
        password: configService.get<string>('REDIS_PASSWORD'),
      },
    }),
  })
