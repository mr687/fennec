import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import {
  ApiControllerContract,
  ApiResponse,
  CommonIdDto,
  ICommonCrudApiController,
  PaginateDto,
  RequestValidation,
} from 'src/shared'

import { Authorize } from '../../auth.decorator'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { User } from './user.schema'
import { UserService } from './user.service'

@ApiTags('users')
@Controller('/modules/users')
export class UserController extends ApiControllerContract implements ICommonCrudApiController<User> {
  public constructor(private userService: UserService) {
    super()
  }

  @Get()
  @Authorize()
  public async getAll(@Query() params: PaginateDto): Promise<ApiResponse<User[]>> {
    const response = await this.userService.findAll(params)
    return this.respondPaginated(response, params)
  }

  @Get(':id')
  @Authorize()
  public async getById(@Param('id') _id: CommonIdDto['id']): Promise<ApiResponse<User>> {
    throw new Error('Method not implemented.')
  }

  @Post('/register')
  @UsePipes(RequestValidation)
  public async create(@Body() params: CreateUserDto): Promise<ApiResponse<User>> {
    const createdUser = await this.userService.create(params)
    return this.respondCreated(createdUser)
  }

  @Patch(':id')
  @Authorize()
  public async update(@Param('id') _id: CommonIdDto['id'], @Body() _params: UpdateUserDto): Promise<ApiResponse<User>> {
    throw new Error('Method not implemented.')
  }

  @Delete(':id')
  @Authorize()
  public async delete(@Param('id') _id: CommonIdDto['id']): Promise<ApiResponse<User>> {
    throw new Error('Method not implemented.')
  }
}
