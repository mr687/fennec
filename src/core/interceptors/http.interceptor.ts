import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import {FastifyReply, FastifyRequest} from 'fastify'
import {Observable, tap} from 'rxjs'

@Injectable()
export class HttpInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpInterceptor.name)
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const now = Date.now()
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    request.headers.date = `${now}`
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<FastifyReply>()
        const diff = Date.now() - +(request.headers.date ?? 0)
        const formattedMessage = `${request.method} ${request.url} ${response.statusCode} ${diff}ms`
        this.logger.log(formattedMessage)
      }),
    )
  }
}
