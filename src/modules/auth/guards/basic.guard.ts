import {Injectable} from '@nestjs/common'
import {AuthGuard} from '@nestjs/passport'

import {PassportStrategyEnum} from '../strategies'

@Injectable()
export class BasicGuard extends AuthGuard(PassportStrategyEnum.BasicStrategy) {}
