import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { Logger } from 'nestjs-pino'

import { AppModule } from './app.module'

declare const module: any

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  })

  const configService = app.get(ConfigService)
  const logger = app.get(Logger)
  app.flushLogs()
  app.enableCors()
  app.useLogger(logger)

  const appPort = configService.get('PORT', 3000)
  const appHost = configService.get('HOST', '0.0.0.0')

  await app.listen(appPort, appHost)

  // Hot Module Replacement
  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}
bootstrap()
