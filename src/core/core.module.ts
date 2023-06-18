import {Module} from '@nestjs/common'
import {APP_FILTER, APP_INTERCEPTOR} from '@nestjs/core'

import {registerEnv, registerLogger, registerMongoose} from './config'
import {BullBoardModule} from './config/bull/bull-board.module'
import {HttpErrorFilter} from './filters/http-error.filter'
import {HttpInterceptor} from './interceptors/http.interceptor'

@Module({
  imports: [
    registerLogger(),
    registerEnv(),
    registerMongoose(),
    BullBoardModule,
  ],
  providers: [
    {provide: APP_FILTER, useClass: HttpErrorFilter},
    {provide: APP_INTERCEPTOR, useClass: HttpInterceptor},
  ],
})
export class CoreModule {}
