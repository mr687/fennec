import {Module} from '@nestjs/common'
import {PassportModule} from '@nestjs/passport'

import {AuthService} from './auth.service'
import {UserModule} from './modules/users/user.module'
import {BasicStrategy} from './strategies/basic.strategy'

@Module({
  imports: [UserModule, PassportModule],
  providers: [AuthService, BasicStrategy],
})
export class AuthModule {}
