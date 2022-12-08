import { ClientSession, Model } from 'mongoose'

import { PaginateDto } from './api-controller.contract'

export abstract class ServiceContract<Doc = unknown> {
  private _model: Model<Doc> | undefined

  public mongoSession: ClientSession | undefined

  public constructor(model?: Model<Doc>) {
    this._model = model
  }

  public setMongoSession(mongoSession: ClientSession) {
    this.mongoSession = mongoSession
  }

  public async findBy(column: string, value: any): Promise<Doc | null> {
    const query: any = {
      [column]: value,
    }

    const doc = await this.model.findOne(query).session(this.mongoSession || null)
    return doc
  }

  public async countDocs(): Promise<number> {
    const totalData = await this.model.estimatedDocumentCount()
    return totalData ?? 0
  }

  public get model() {
    if (!this._model) {
      throw new Error('Service not configured properly for Service-model.')
    }
    return this._model
  }

  protected buildPaginateQuery(params: PaginateDto, query = {}) {
    const { perPage = 10, page = 1 } = params

    return this.model
      .find(query)
      .limit(perPage)
      .skip((page - 1) * perPage)
      .exec()
  }
}
