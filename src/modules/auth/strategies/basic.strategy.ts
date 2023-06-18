import {Injectable} from '@nestjs/common'
import {PassportStrategy} from '@nestjs/passport'
import {FastifyRequest} from 'fastify'
import {Strategy} from 'passport-custom'

import {parseBasicTokenFromRequestHeader} from '@/shared/utils'

import {PassportStrategyEnum} from './enum.strategy'
import {AuthService} from '../auth.service'

@Injectable()
export class BasicStrategy extends PassportStrategy(
  Strategy,
  PassportStrategyEnum.BasicStrategy,
) {
  public constructor(private authService: AuthService) {
    super()
  }

  public async validate(request: FastifyRequest): Promise<boolean> {
    const basicToken = parseBasicTokenFromRequestHeader(request)
    if (!basicToken) {
      return false
    }
    const validatedAuthKey = await this.authService.validateAuthBasic(
      basicToken,
    )
    return validatedAuthKey !== undefined
  }
}
