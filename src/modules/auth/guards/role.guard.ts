import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable } from 'rxjs'

import { ROLE_KEY } from '../auth.decorator'
import { UserType } from '../modules/users/dto/user.dto'
import type { User } from '../modules/users/user.schema'

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles) {
      return true
    }
    const req = context.switchToHttp().getRequest()
    const user = req.user as User
    return requiredRoles.some(role => user.type?.includes(role))
  }
}
