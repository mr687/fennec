import { ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'

export const registerMongooseFeature = (name: string, schema: any) =>
  MongooseModule.forFeature([{ name: name, schema: schema }])

export const registerMongoose = () =>
  MongooseModule.forRootAsync({
    useFactory: async (configService: ConfigService) => ({
      uri: configService.getOrThrow<string>('MONGO_URI'),
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }),
    inject: [ConfigService],
  })
