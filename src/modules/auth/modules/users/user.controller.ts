import {
  Body,
  Controller,
  Delete,
  Get,
  NotImplementedException,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common'

import {
  ApiControllerContract,
  ApiResponse,
  CommonIdDto,
  ICommonCrudApiController,
  PaginateDto,
} from '@/shared/contracts'
import {RequestValidation} from '@/shared/validations'

import {CreateUserDto} from './dto/create-user.dto'
import {UpdateUserDto} from './dto/update-user.dto'
import {User} from './user.schema'
import {UserService} from './user.service'
import {Authorize} from '../../auth.decorator'

@Controller('/modules/users')
export class UserController
  extends ApiControllerContract
  implements ICommonCrudApiController<User>
{
  public constructor(private userService: UserService) {
    super()
  }

  @Get()
  @Authorize()
  public async getAll(
    @Query() params: PaginateDto,
  ): Promise<ApiResponse<User[]>> {
    const response = await this.userService.findAll(params)
    return this.respondPaginated(response, params)
  }

  @Get(':id')
  @Authorize()
  public async getById(
    @Param('id') _id: CommonIdDto['id'],
  ): Promise<ApiResponse<User>> {
    throw new Error('Method not implemented.')
  }

  @Post('/register')
  @UsePipes(RequestValidation)
  public async create(
    @Body() _params: CreateUserDto,
  ): Promise<ApiResponse<User>> {
    throw new NotImplementedException('Method not implemented.')
    // const createdUser = await this.userService.create(params)
    // return this.respondCreated(createdUser)
  }

  @Patch(':id')
  @Authorize()
  public async update(
    @Param('id') _id: CommonIdDto['id'],
    @Body() _params: UpdateUserDto,
  ): Promise<ApiResponse<User>> {
    throw new NotImplementedException('Method not implemented.')
  }

  @Delete(':id')
  @Authorize()
  public async delete(
    @Param('id') _id: CommonIdDto['id'],
  ): Promise<ApiResponse<User>> {
    throw new NotImplementedException('Method not implemented.')
  }
}
