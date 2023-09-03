import { ConflictException, Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { plainToInstance } from 'class-transformer'
import { Model } from 'mongoose'

import { PaginateDto, ServiceContract } from '@/shared/contracts'
import { randomPassword, randomString } from '@/shared/utils'

import { CreateUserDto } from './dto/create-user.dto'
import { UserType } from './dto/user.dto'
import { User, UserDoc } from './user.schema'

@Injectable()
export class UserService extends ServiceContract<UserDoc> implements OnApplicationBootstrap {
  public username = 'email'

  public constructor(@InjectModel(User.name) private userModel: Model<UserDoc>) {
    super(userModel)
  }

  async onApplicationBootstrap() {
    const existingAdmins = await this.model.countDocuments({
      type: UserType.Admin,
    })
    if (existingAdmins === 0) {
      const { writeFileSync } = await import('fs')
      const creds = {
        name: randomString(6),
        email: `${randomString(6)}@admin.com`.toLowerCase(),
        password: randomPassword(),
        secretKey: randomPassword(),
        type: UserType.Admin,
      }
      writeFileSync('creds.txt', JSON.stringify(creds, null, 2))
      await this.create(creds)
    }
  }

  public async findAll(params: PaginateDto): Promise<{ totalData: number; data: User[] }> {
    const query = {}
    const userQuery = this.buildPaginateQuery(params, query)
    const [totalData, data] = await Promise.all([this.countDocs(), userQuery])

    return { totalData, data: plainToInstance(User, data) }
  }

  public async create(params: CreateUserDto): Promise<User> {
    const role = params?.type ?? UserType.Client
    const email = params?.email ?? `${randomString(6)}@${role}.com`.toLowerCase()

    const existingUserByEmail = await this.findBy('email', email)
    if (existingUserByEmail) {
      throw new ConflictException({
        message: 'Duplicate email.',
        errorCode: 'USER_DUPLICATE_EMAIL',
      })
    }

    const generatedSecretKey = params?.secretKey ?? randomPassword()
    const password = params?.password ?? randomPassword()

    const newUser = new this.userModel(params)
    newUser.$session(this.mongoSession)
    newUser.email = email
    newUser.password = password
    newUser.secretKey = generatedSecretKey
    newUser.type = role
    await newUser.save()

    const data: any = newUser.toJSON()
    data.key = generatedSecretKey
    data.password = password

    return data
  }

  public async findByUsername(username: string) {
    const doc = await this.findBy(this.username, username)
    return doc
  }
}
