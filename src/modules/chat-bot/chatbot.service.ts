import { InjectQueue } from '@nestjs/bull'
import { ForbiddenException, Injectable, UnprocessableEntityException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Queue } from 'bull'
import { Model } from 'mongoose'

import {
  SendMessageOtpDto,
  SendMessageTextDto,
  WhatsappBaileysService,
  WhatsappBaileysSessionId,
} from 'src/modules/chat-bot/providers/whatsapp-baileys'
import { ServiceContract, randomSessionId } from 'src/shared'

import { ChatBotSession, ChatBotSessionDoc } from './chatbot-session.schema'

@Injectable()
export class ChatBotService extends ServiceContract<ChatBotSessionDoc> {
  public constructor(
    protected readonly whatsappBaileysService: WhatsappBaileysService,
    @InjectQueue('chat-bot') protected readonly waBotQueue: Queue<SendMessageTextDto>,
    @InjectModel(ChatBotSession.name) protected readonly sessionModel: Model<ChatBotSessionDoc>,
  ) {
    super(sessionModel)
  }

  public async create(data: any) {
    const { name } = data
    const newSession = new this.model()
    newSession.$session(this.mongoSession)
    newSession.name = name
    return newSession.save()
  }

  public async getStatus(sessionId: WhatsappBaileysSessionId) {
    const result = await this.whatsappBaileysService.getStatus(sessionId)
    return result
  }

  public async loginSession() {
    const sessionId = randomSessionId()

    let session = await this.findBy('name', sessionId)
    if (!session) {
      session = await this.create({ name: sessionId })
    }
    const result = await this.whatsappBaileysService.newSession(sessionId)

    return result
  }

  public async sendMessageOtp(params: SendMessageOtpDto) {
    const { receiver, code, sessionId } = params

    const session = await this.findBy('name', sessionId)
    if (!session) {
      throw new ForbiddenException()
    }

    const MessageOTPFormat = 'Your OTP code is {code}.\nPLEASE DO NOT SHARE THIS OTP WITH ANYONE!'

    const message = MessageOTPFormat.replace('{code}', code.toString())

    const job = await this.waBotQueue.add(
      'sendMessageOtp',
      {
        sessionId,
        receiver,
        content: message,
      },
      {},
    )

    const result = {
      jobId: job.id,
      receiver,
      content: message,
      status: 'QUEUED',
    }
    return result
  }

  public async sendCustomMessage(params: any) {
    const { receiver, content, sessionId } = params

    const session = await this.findBy('name', sessionId)
    if (!session) {
      throw new UnprocessableEntityException()
    }

    const job = await this.waBotQueue.add(
      'sendCustomMessage',
      {
        sessionId,
        receiver,
        content,
      },
      {},
    )

    const result = {
      jobId: job.id,
      receiver,
      message: content,
      status: 'QUEUED',
    }
    return result
  }
}
