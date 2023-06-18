import {VersioningType} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {NestFactory} from '@nestjs/core'
import {FastifyAdapter, NestFastifyApplication} from '@nestjs/platform-fastify'
import {Logger} from 'nestjs-pino'

import {AppModule} from './app.module'

declare const module: any

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      bufferLogs: true,
    },
  )

  const configService = app.get(ConfigService)
  const logger = app.get(Logger)
  app.flushLogs()

  await app.register(import('@fastify/compress'), {
    encodings: ['gzip', 'deflate'],
  })

  app.enableCors()
  app.useLogger(logger)
  app.enableVersioning({
    type: VersioningType.URI,
  })

  const appPort = configService.get('PORT', 3000)

  await app.listen(appPort, '0.0.0.0')

  // Hot Module Replacement
  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}

bootstrap()
