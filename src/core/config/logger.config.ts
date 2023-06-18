import {ConfigService} from '@nestjs/config'
import {LoggerModule} from 'nestjs-pino'

export const registerLogger = () =>
  LoggerModule.forRootAsync({
    useFactory: (configService: ConfigService) => {
      const isProduction =
        configService.get<string>('NODE_ENV') === 'production'
      const isPretty =
        configService.get<string>('LOG_PRETTY', 'false') === 'true'
      return {
        pinoHttp: {
          name: configService.get<string>('APP_NAME', 'MyApp'),
          level: configService.get<string>('LOG_LEVEL', 'trace'),
          transport:
            isProduction || !isPretty ? undefined : {target: 'pino-pretty'},
        },
      }
    },
    inject: [ConfigService],
  })
