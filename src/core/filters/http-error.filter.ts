import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable, Logger } from '@nestjs/common'

import { ApiResponse } from '@/shared/contracts'

@Catch(HttpException)
@Injectable()
export class HttpErrorFilter implements ExceptionFilter<HttpException> {
  private readonly logger = new Logger(HttpErrorFilter.name)

  public catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest()
    const response = ctx.getResponse()
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
