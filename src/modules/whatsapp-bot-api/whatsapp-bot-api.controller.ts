import { ApiControllerContract, RequestValidation } from 'src/shared'
import { Body, Controller, Post, UsePipes } from '@nestjs/common'
import { LoginSessionDto, SendMessageOtpDto } from './dto'
import { Authorize } from '../auth'
import { WhatsappBotApiService } from './whatsapp-bot-api.service'

@Controller('/modules/whatsapp-bot-api')
@Authorize()
export class WhatsappBotApiController extends ApiControllerContract {
  public constructor(protected readonly whatsappBotApiService: WhatsappBotApiService) {
    super()
  }

  @Post('/addSession')
  @UsePipes(RequestValidation)
  public async loginSession(@Body() params: LoginSessionDto) {
    const result = await this.whatsappBotApiService.loginSession(params)
    return this.respond(result)
  }

  @Post('/sendOtp')
  @UsePipes(RequestValidation)
  public async sendMessageOtp(@Body() params: SendMessageOtpDto) {
    const result = await this.whatsappBotApiService.sendMessageOtp(params)
    return this.respond(result)
  }
}
