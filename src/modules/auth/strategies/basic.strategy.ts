import { IncomingMessage } from 'http'

import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-custom'

import { parseBasicTokenFromRequestHeader } from '@/shared/utils'

import { AuthService } from '../auth.service'
import type { User } from '../modules/users/user.schema'
import { PassportStrategyEnum } from './enum.strategy'

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy, PassportStrategyEnum.BasicStrategy) {
  public constructor(private authService: AuthService) {
    super()
  }

  public async validate(request: IncomingMessage): Promise<User | false> {
    const basicToken = parseBasicTokenFromRequestHeader(request)
    if (!basicToken) {
      return false
    }
    const user = await this.authService.validateAuthBasic(basicToken)
    return user ? user : false
  }
}
