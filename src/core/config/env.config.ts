import {ConfigModule} from '@nestjs/config'

export const registerEnv = () =>
  ConfigModule.forRoot({
    cache: true,
    expandVariables: true,
    isGlobal: true,
  })
