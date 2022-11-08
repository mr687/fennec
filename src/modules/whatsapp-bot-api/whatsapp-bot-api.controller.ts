import { ApiControllerContract, RequestValidation } from 'src/shared'
import { Body, Controller, Post, UsePipes } from '@nestjs/common'
import { LoginSessionDto, SendMessageOtpDto } from './whatsapp-bot-api.dto'
import { WhatsappBotApiService } from './whatsapp-bot-api.service'

@Controller('/whatsapp-bot-api')
export class WhatsappBotApiController extends ApiControllerContract {
  public constructor(protected whatsappBotApiService: WhatsappBotApiService) {
    super()
  }

  @Post('/login')
  @UsePipes(RequestValidation)
  public async loginSession(@Body() params: LoginSessionDto) {
    const result = await this.whatsappBotApiService.loginSession(params)
    return this.respond(result)
  }

  @Post('/send-otp')
  @UsePipes(RequestValidation)
  public async sendMessageOtp(@Body() params: SendMessageOtpDto) {
    const result = await this.whatsappBotApiService.sendMessageOtp(params)
    return this.respond(result)
  }
}
