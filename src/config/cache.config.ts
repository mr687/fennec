import { CacheModule } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { redisStore } from 'cache-manager-redis-yet'

export const registerCache = () =>
  CacheModule.registerAsync({
    isGlobal: true,
    useFactory: async (configService: ConfigService) => {
      const store = await redisStore({
        socket: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
        username: configService.get('REDIS_USERNAME'),
        password: configService.get('REDIS_PASSWORD'),
      })
      return {
        store: {
          create: () => store,
        },
      }
    },
    inject: [ConfigService],
  })
