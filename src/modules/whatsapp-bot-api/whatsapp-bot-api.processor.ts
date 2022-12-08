import { Process, Processor } from '@nestjs/bull'
import { Job } from 'bull'
import { UseLogger } from 'src/shared'
import { SendMessageTextDto, WhatsappBaileysService } from './providers/whatsapp-baileys'

@Processor('whatsapp')
export class WhatsappBotApiProcessor extends UseLogger {
  protected name = WhatsappBotApiProcessor.name

  public constructor(protected readonly whatsappBaileysService: WhatsappBaileysService) {
    super()
  }

  @Process('sendMessageOtp')
  public async sendMessageOtp(job: Job<SendMessageTextDto>) {
    const { id, data } = job
    this.log.debug(`[${id}] Processing Job...`)

    await this.whatsappBaileysService.sendTextMessage(data)
  }
}
