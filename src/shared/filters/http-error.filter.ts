import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable } from '@nestjs/common'
import { Request, Response } from 'express'

import { LoggerService } from 'src/modules/logger/logger.service'

import { ApiResponse } from '../contracts'
import { UseLogger } from '../contracts/logger.contract'

@Catch(HttpException)
@Injectable()
export class HttpErrorFilter implements ExceptionFilter<HttpException> {
  protected name: string = HttpErrorFilter.name
  private readonly logger = new LoggerService(HttpErrorFilter.name)

  public constructor() {
    this.logger.setContext(HttpErrorFilter.name)
  }

  public catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()
    const status = exception.getStatus()
    const errorMessage = exception.message
    let errors = null

    const errorRes = exception.getResponse()
    if (errorRes instanceof Object) {
      errors = (errorRes as any).errors || null
    }

    const errorResponse: ApiResponse = {
      data: errors,
      metadata: {
        status: false,
        statusCode: status,
        message: errorMessage,
      },
    }

    const diff = Date.now() - +(request.headers.date ?? 0)
    this.logger.error(`${request.method} ${request.url} ${status} ${errorMessage} ${diff}ms`)

    return response.status(status).send(errorResponse)
  }
}
