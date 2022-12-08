import { ApiDataResponse, ApiMetadataResponse, ApiResponse } from './response.contract'

import { ControllerContract } from './controller.contract'
import { HttpStatus } from '@nestjs/common'

export interface PaginateDto {
  perPage: number
  page: number
  orderBy: string
  sort: 'desc' | 'asc'
}

export type CommonIdDto = { id: string }

export type ApiGetAllDto = PaginateDto

export interface ICommonCrudApiController<T = any> {
  getAll(params: ApiGetAllDto): Promise<ApiResponse<T[]>>
  getById(id: CommonIdDto['id']): Promise<ApiResponse<T>>
  create(params: unknown): Promise<ApiResponse<T>>
  update(id: CommonIdDto['id'], params: unknown): Promise<ApiResponse<T>>
  delete(id: CommonIdDto['id']): Promise<ApiResponse<T>>
}

export abstract class ApiControllerContract extends ControllerContract {
  private _response: ApiResponse

  public constructor() {
    super()

    this._response = {
      data: null,
      metadata: {
        status: true,
        statusCode: HttpStatus.OK,
        message: 'Success',
        paginate: undefined,
      },
    }
  }

  protected respond<T = any>(
    data: ApiDataResponse['data'],
    metadata: Partial<ApiMetadataResponse['metadata']> = {},
  ): ApiResponse<T> {
    this._response.data = data
    this._response.metadata = Object.assign(this._response.metadata, metadata)

    return this._response
  }

  protected respondCreated<T = any>(data: ApiDataResponse['data']): ApiResponse<T> {
    return this.respond(data, {
      statusCode: HttpStatus.CREATED,
      message: 'Data successfully created.',
    })
  }

  protected respondPaginated<T = any>(
    response: { totalData: number; data: T },
    params: { page: number; perPage: number },
  ): ApiResponse<T> {
    const { totalData, data } = response
    const { page = 1, perPage = 10 } = params

    return this.respond(data, {
      statusCode: HttpStatus.OK,
      paginate: {
        currentPage: +page,
        perPage: +perPage,
        totalData: +totalData,
        totalPage: Math.ceil(totalData / perPage),
      },
    })
  }
}
