import { ConflictException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { v4 as UUIDv4 } from 'uuid'

import { PaginateDto, ServiceContract } from 'src/shared'

import { CreateUserDto } from './dto/create-user.dto'
import { User, UserDoc } from './user.schema'

@Injectable()
export class UserService extends ServiceContract<UserDoc> {
  public username = 'email'

  public constructor(@InjectModel(User.name) private userModel: Model<UserDoc>) {
    super(userModel)
  }

  public async findAll(params: PaginateDto): Promise<{ totalData: number; data: User[] }> {
    const query = {}
    const userQuery = this.buildPaginateQuery(params, query)
    const [totalData, data] = await Promise.all([this.countDocs(), userQuery])

    return { totalData, data }
  }

  public async create(params: CreateUserDto): Promise<User> {
    const { email } = params

    const existingUserByEmail = await this.findBy('email', email)
    if (existingUserByEmail) {
      throw new ConflictException({ message: 'Duplicate email.', errorCode: 'USER_DUPLICATE_EMAIL' })
    }

    const generatedSecretKey = UUIDv4()

    const newUser = new this.userModel(params)
    newUser.$session(this.mongoSession)
    newUser.secretKey = generatedSecretKey
    await newUser.save()
    const data: any = newUser.toJSON()
    data.key = generatedSecretKey
    return data
  }

  public async findByUsername(username: string) {
    const doc = await this.findBy(this.username, username)
    return doc
  }
}
