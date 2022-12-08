import {
  LoginSessionDto,
  SendMessageOtpDto,
  SendMessageTextDto,
  WhatsappBaileysService,
} from 'src/modules/whatsapp-bot-api/providers/whatsapp-baileys'
import { Injectable } from '@nestjs/common'
import { ServiceContract } from 'src/shared'
import { Queue } from 'bull'
import { InjectQueue } from '@nestjs/bull'
import { InjectModel } from '@nestjs/mongoose'
import { WhatsappSession, WhatsappSessionDoc } from './whatsapp-bot-api.schema'
import { Model } from 'mongoose'

@Injectable()
export class WhatsappBotApiService extends ServiceContract<WhatsappSessionDoc> {
  public constructor(
    protected readonly whatsappBaileysService: WhatsappBaileysService,
    @InjectQueue('whatsapp') protected readonly waBotQueue: Queue<SendMessageTextDto>,
    @InjectModel(WhatsappSession.name) protected readonly sessionModel: Model<WhatsappSessionDoc>,
  ) {
    super(sessionModel)
  }

  public async create(data: any) {
    const { name, jid, username, imgUrl } = data
    const newSession = new this.model()
    newSession.$session(this.mongoSession)
    newSession.name = name
    newSession.jid = jid
    newSession.username = username
    newSession.imgUrl = imgUrl
    return newSession.save()
  }

  public async loginSession(params: LoginSessionDto) {
    const { sessionName } = params

    let session = await this.findBy('name', sessionName)
    if (!session) {
      session = await this.create({ name: sessionName })
    }
    const result = await this.whatsappBaileysService.newSession(params)

    // const { user } = result
    // session.jid = user.id
    // session.username = user.name
    // session.imgUrl = user.imgUrl
    // await session.save()

    return result
  }

  public async sendMessageOtp(params: SendMessageOtpDto) {
    const { receiver, code, sessionId } = params

    const MessageOTPFormat = 'Your OTP code is {code}.\nPLEASE DO NOT SHARE THIS OTP WITH ANYONE!'

    const message = MessageOTPFormat.replace('{code}', code.toString())

    const job = await this.waBotQueue.add(
      'sendMessageOtp',
      {
        sessionId,
        receiver,
        message,
      },
      {},
    )

    const result = {
      jobId: job.id,
      receiver,
      message,
    }
    return result
  }
}
