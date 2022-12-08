import { HttpStatus } from '@nestjs/common'

export type ApiDataResponse<T = any> = {
  data: T
}

export type ApiMetadataPaginateResponse = {
  paginate: {
    currentPage: number
    totalPage: number
    perPage: number
    totalData: number
  }
}

export type ApiMetadataResponse = {
  metadata: {
    status: boolean
    statusCode: HttpStatus
    message: string
    paginate?: ApiMetadataPaginateResponse['paginate'] | null
  }
}

export type ApiResponse<T = any> = ApiDataResponse<T> & ApiMetadataResponse
