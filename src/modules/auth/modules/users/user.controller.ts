import {
  ApiControllerContract,
  ApiResponse,
  CommonIdDto,
  ICommonCrudApiController,
  PaginateDto,
  RequestValidation,
} from 'src/shared'

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
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
  public async getAll(@Query() params: PaginateDto): Promise<ApiResponse<User[]>> {
    const response = await this.userService.findAll(params)
    return this.respondPaginated(response, params)
  }

  @Get(':id')
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
  public async update(@Param('id') _id: CommonIdDto['id'], @Body() _params: UpdateUserDto): Promise<ApiResponse<User>> {
    throw new Error('Method not implemented.')
  }

  @Delete(':id')
  public async delete(@Param('id') _id: CommonIdDto['id']): Promise<ApiResponse<User>> {
    throw new Error('Method not implemented.')
  }
}
