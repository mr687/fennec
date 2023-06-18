import {BullAdapter} from '@bull-board/api/bullAdapter'
import {FastifyAdapter} from '@bull-board/fastify'
import {BullBoardModule} from '@bull-board/nestjs'

export const registerBullBoardFeature = (name: string) =>
  BullBoardModule.forFeature({
    name: name,
    adapter: BullAdapter,
  })

export const registerBullBoard = () =>
  BullBoardModule.forRoot({
    route: '/queues',
    adapter: FastifyAdapter,
    boardOptions: {
      uiConfig: {
        boardTitle: 'Queues Inspect',
      },
    },
  })
