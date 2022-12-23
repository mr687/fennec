import { OnQueueActive, OnQueueCompleted, Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'

import { UseLogger } from 'src/shared'

import { SendMessageTextDto, WhatsappBaileysService } from './providers/whatsapp-baileys'

@Processor('chat-bot')
export class ChatBotProcessor extends UseLogger {
  protected name = ChatBotProcessor.name

  public constructor(protected readonly whatsappBaileysService: WhatsappBaileysService) {
    super()
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.log.info(`Processing job ${job.id} of type ${job.name} with data:`)
    this.log.debug(job.data)
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.log.info(`Completed job ${job.id} of type ${job.name} with data:`)
    this.log.debug(job.data)
  }

  @Process('sendMessageOtp')
  public async sendMessageOtp(job: Job<SendMessageTextDto>) {
    const { data } = job

    await this.whatsappBaileysService.sendTextMessage(data)
  }

  @Process('sendCustomMessage')
  public async sendCustomMessage(job: Job<SendMessageTextDto>) {
    const { data } = job

    await this.whatsappBaileysService.sendMessage(data)
  }
}
