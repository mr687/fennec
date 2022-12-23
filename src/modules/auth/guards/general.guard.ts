import { ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { Observable } from 'rxjs'

import { AuthType } from '../auth.type'
import { PassportStrategyEnum } from '../strategies'

@Injectable()
export class GeneralGuard extends AuthGuard([PassportStrategyEnum.BasicStrategy]) {
  public constructor(private readonly reflector: Reflector) {
    super()
  }

  public canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isAnonymous = this.reflector.get<string[]>(AuthType.Anonymous, context.getHandler())
    if (isAnonymous) {
      return true
    }

    return super.canActivate(context)
  }
}
