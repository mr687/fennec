import { ControllerContract } from './controller.contract'
import { HttpStatus } from '@nestjs/common'

export type ApiDataResponse = Record<string, any> | null
export type ApiMetadataResponse = {
  status: boolean
  statusCode: HttpStatus
  message: string
}
export type ApiWithPaginationResponse = {
  pagination: {
    page: number
    perPage: number
    totalPages: number
    totalItems: number
  }
}

export type ApiResponse = {
  data: ApiDataResponse
  metadata: ApiMetadataResponse
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
      },
    }
  }

  protected respond(
    data: ApiDataResponse,
    metadata: Partial<ApiMetadataResponse> = {},
  ): ApiResponse {
    this._response.data = data
    this._response.metadata = Object.assign(this._response.metadata, metadata)

    return this._response
  }
}
