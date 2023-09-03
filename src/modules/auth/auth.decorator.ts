import { SetMetadata, UseGuards } from '@nestjs/common'

import { AuthType } from './auth.type'
import { GeneralGuard } from './guards/general.guard'
import { RoleGuard } from './guards/role.guard'

export const Anonymous = () => SetMetadata(AuthType.Anonymous, AuthType.Anonymous)
export const Authorize = () => UseGuards(GeneralGuard, RoleGuard)

export const ROLE_KEY = 'roles'
export const Roles = (...roles: string[]) => SetMetadata(ROLE_KEY, roles)
