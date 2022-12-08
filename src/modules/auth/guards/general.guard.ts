import { ExecutionContext, Injectable } from '@nestjs/common'

import { AuthGuard } from '@nestjs/passport'
import { AuthType } from '../auth.type'
import { Observable } from 'rxjs'
import { PassportStrategyEnum } from '../strategies'
import { Reflector } from '@nestjs/core'

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
