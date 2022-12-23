import { CallHandler, ExecutionContext, Injectable, NestInterceptor, NotImplementedException } from '@nestjs/common'
import { Request, Response } from 'express'
import { Observable, tap } from 'rxjs'

import { LoggerService } from '../logger.service'

@Injectable()
export class HttpInterceptor implements NestInterceptor {
  private readonly logger: LoggerService = new LoggerService(HttpInterceptor.name)

  public constructor() {
    this.logger.setContext(HttpInterceptor.name)
  }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
    const now = Date.now()
    const request = context.switchToHttp().getRequest<Request>()
    request.headers.date = `${now}`
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>()
        const diff = Date.now() - +(request.headers.date ?? 0)
        const formattedMessage = `${request.method} ${request.url} ${response.statusCode} ${diff}ms`
        this.logger.info(formattedMessage)
      }),
    )
  }
}
