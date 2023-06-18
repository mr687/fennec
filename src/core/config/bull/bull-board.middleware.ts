import type {IncomingMessage, ServerResponse} from 'http'

import {HttpStatus, Injectable, NestMiddleware} from '@nestjs/common'

import {AuthService} from '@/modules/auth/auth.service'
import {parseBasicTokenFromRequestHeader} from '@/shared/utils'

@Injectable()
export class BullBoardMiddleware implements NestMiddleware {
  constructor(public readonly authService: AuthService) {}
  async use(req: IncomingMessage, res: ServerResponse, next: () => void) {
    const nextError = () => {
      if (res.headersSent) {
        return next()
      }
      res.statusCode = HttpStatus.UNAUTHORIZED
      res.setHeader(
        'WWW-Authenticate',
        'Basic realm="User Visible realm", charset="UTF-8"',
      )
      res.write('401 Unauthorized')
      res.end()
    }
    const basicToken = parseBasicTokenFromRequestHeader(req)
    if (!basicToken) {
      return nextError()
    }
    const user = await this.authService.validateAuthBasic(basicToken)
    if (!user) {
      return nextError()
    }
    return next()
  }
}
