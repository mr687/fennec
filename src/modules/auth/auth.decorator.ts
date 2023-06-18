import {SetMetadata, UseGuards} from '@nestjs/common'

import {AuthType} from './auth.type'
import {GeneralGuard} from './guards/general.guard'

export const Anonymous = () =>
  SetMetadata(AuthType.Anonymous, AuthType.Anonymous)
export const Authorize = () => UseGuards(GeneralGuard)
