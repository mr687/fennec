import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Request } from 'express'
import { Strategy } from 'passport-custom'

import { parseBasicTokenFromRequestHeader } from 'src/shared'

import { AuthService } from '../auth.service'
import { PassportStrategyEnum } from './enum.strategy'

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy, PassportStrategyEnum.BasicStrategy) {
  public constructor(private authService: AuthService) {
    super()
  }

  public async validate(request: Request): Promise<boolean> {
    const basicToken = parseBasicTokenFromRequestHeader(request)
    if (!basicToken) {
      return false
    }

    const validatedAuthKey = await this.authService.validateAuthBasic(basicToken)
    return validatedAuthKey !== undefined
  }
}
