import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common'
import {HttpAdapterHost} from '@nestjs/core'
import {FastifyAdapter} from '@nestjs/platform-fastify'

import {AuthModule} from '@/modules/auth/auth.module'

import {registerBullBoard} from './bull-board.config'
import {BullBoardMiddleware} from './bull-board.middleware'
import {registerBull} from './bull.config'

@Module({
  imports: [registerBull(), registerBullBoard(), AuthModule],
  providers: [BullBoardMiddleware],
})
export class BullBoardModule implements NestModule {
  constructor(
    private readonly adapterHost: HttpAdapterHost<FastifyAdapter>,
    private readonly bullBoardMiddleware: BullBoardMiddleware,
  ) {}
  configure(_consumer: MiddlewareConsumer) {
    // force bull board to use middleware
    this.adapterHost.httpAdapter
      .getInstance()
      .addHook('onRequest', (req, res, next) => {
        if (req.url.startsWith('/queues')) {
          return this.bullBoardMiddleware.use(req.raw, res.raw, next)
        }
        next()
      })
  }
}
