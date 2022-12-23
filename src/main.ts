// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import compression from '@fastify/compress'
import { VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'

import { AppModule } from './app.module'
import { LoggerService } from './modules/logger/logger.service'

declare const module: any

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), { bufferLogs: true })

  const configService = app.get(ConfigService)
  const logger = app.get(LoggerService)

  // const swaggerConfig = new DocumentBuilder()
  //   .setTitle('Whatsapp Bot API')
  //   .setDescription('Automate whatsapp for business intelligent')
  //   .setVersion('0.0')
  //   .addTag('chat-bot')
  //   .build()
  // const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig)
  // SwaggerModule.setup('swagger-docs', app, swaggerDoc)

  await app.register(compression, { encodings: ['gzip', 'deflate'] })

  app.enableCors()
  app.useLogger(logger)
  app.enableVersioning({
    type: VersioningType.URI,
  })

  const defaultPort = 3000
  const port = configService.get('APP_PORT') ?? defaultPort

  await app.listen(port)

  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}
bootstrap()
