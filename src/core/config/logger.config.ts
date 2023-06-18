import {ConfigService} from '@nestjs/config'
import {LoggerModule} from 'nestjs-pino'

export const registerLogger = () =>
  LoggerModule.forRootAsync({
    useFactory: (configService: ConfigService) => {
      const isProduction = configService.get('NODE_ENV') === 'production'
      return {
        pinoHttp: {
          name: configService.get('APP_NAME', 'MyApp'),
          level: configService.get('LOG_LEVEL', 'debug'),
          transport: isProduction
            ? undefined
            : {
                target: 'pino-pretty',
              },
        },
      }
    },
    inject: [ConfigService],
  })
