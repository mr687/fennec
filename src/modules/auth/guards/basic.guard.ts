import { AuthGuard } from '@nestjs/passport'
import { Injectable } from '@nestjs/common'
import { PassportStrategyEnum } from '../strategies'

@Injectable()
export class BasicGuard extends AuthGuard(PassportStrategyEnum.BasicStrategy) {}
