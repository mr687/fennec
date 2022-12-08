import { AuthService } from './auth.service'
import { BasicStrategy } from './strategies/basic.strategy'
import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { UserModule } from './modules/users/user.module'

@Module({
  imports: [UserModule, PassportModule],
  providers: [AuthService, BasicStrategy],
  exports: [AuthService],
})
export class AuthModule {}
