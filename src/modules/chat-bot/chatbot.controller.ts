import {Body, Controller, Get, Post, Query, UsePipes} from '@nestjs/common'

import {ApiControllerContract} from '@/shared/contracts'
import {RequestValidation} from '@/shared/validations'

import {ChatBotService} from './chatbot.service'
import {SendMessageOtpDto} from './dto'
import {Authorize} from '../auth'

@Controller('/modules/chat-bot')
@Authorize()
export class ChatBotController extends ApiControllerContract {
  public constructor(protected readonly whatsappBotApiService: ChatBotService) {
    super()
  }

  @Post('/addSession')
  public async loginSession() {
    const result = await this.whatsappBotApiService.loginSession()
    return this.respond(result)
  }

  @Post('/sendOtp')
  @UsePipes(RequestValidation)
  public async sendMessageOtp(@Body() params: SendMessageOtpDto) {
    const result = await this.whatsappBotApiService.sendMessageOtp(params)
    return this.respond(result)
  }

  @Post('/sendCustomMessage')
  @UsePipes(RequestValidation)
  public async sendCustomMessage(@Body() params: any) {
    const result = await this.whatsappBotApiService.sendCustomMessage(params)
    return result
  }

  @Get('/pollStatus')
  public async pollStatus(@Query('sessionId') sessionId: string) {
    const result = await this.whatsappBotApiService.getStatus(sessionId)
    return this.respond(result)
  }
}
