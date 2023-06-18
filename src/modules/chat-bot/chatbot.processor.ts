import {OnQueueCompleted, OnQueueFailed, Process, Processor} from '@nestjs/bull'
import {Logger} from '@nestjs/common'
import {Job} from 'bull'

import {
  SendMessageTextDto,
  WhatsappBaileysService,
} from '@/providers/whatsapp-baileys'

@Processor('chat-bot')
export class ChatBotProcessor {
  private readonly logger = new Logger(ChatBotProcessor.name)

  public constructor(
    protected readonly whatsappBaileysService: WhatsappBaileysService,
  ) {}

  @OnQueueFailed()
  onFailed(job: Job, error: any) {
    this.logger.error(`Failed job ${job.id} of type ${job.name} with data:`)
    this.logger.error(job.data)
    this.logger.error(error)
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Completed job ${job.id} of type ${job.name} with data:`)
    this.logger.verbose(job.data)
  }

  @Process('sendMessageOtp')
  public async sendMessageOtp(job: Job<SendMessageTextDto>) {
    const {data} = job
    await this.whatsappBaileysService.sendTextMessage(data)
  }

  @Process('sendCustomMessage')
  public async sendCustomMessage(job: Job<SendMessageTextDto>) {
    const {data} = job
    await this.whatsappBaileysService.sendMessage(data)
  }
}
