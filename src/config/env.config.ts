import { ConfigModule } from '@nestjs/config'

export const registerEnv = () =>
  ConfigModule.forRoot({
    expandVariables: true,
    isGlobal: true,
  })
