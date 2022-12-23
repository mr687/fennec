import { ThrottlerModule } from '@nestjs/throttler'

export const registerThrottle = () =>
  ThrottlerModule.forRoot({
    ttl: 60,
    limit: 10,
    // storage: new ThrottlerStorageRedisService()
  })
