// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino'
import { AppModule } from './app.module'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { VersioningType } from '@nestjs/common'
import compression from '@fastify/compress'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), { bufferLogs: true })

  const configService = app.get(ConfigService)
  const logger = app.get(Logger)

  // const swaggerConfig = new DocumentBuilder()
  //   .setTitle('Whatsapp Bot API')
  //   .setDescription('Automate whatsapp for business intelligent')
  //   .setVersion('0.0')
  //   .addTag('whatsapp')
  //   .build()
  // const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig)
  // SwaggerModule.setup('swagger-docs', app, swaggerDoc)

  await app.register(compression, { encodings: ['gzip', 'deflate'] })

  app.useGlobalInterceptors(new LoggerErrorInterceptor())
  app.useLogger(logger)
  app.enableVersioning({
    type: VersioningType.URI,
  })

  const defaultPort = 3000
  const port = configService.get('APP_PORT') ?? defaultPort

  await app.listen(port)
}
bootstrap()
