import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { ApiResponse } from '../contracts'
import { UseLogger } from '../contracts/logger.contract'

@Catch(HttpException)
export class HttpErrorFilter
  extends UseLogger
  implements ExceptionFilter<HttpException>
{
  protected name: string = HttpErrorFilter.name

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

    this.log.error(
      JSON.stringify(errorResponse),
      `${request.method} ${request.url}`,
    )

    response.status(status).json(errorResponse)
  }
}
