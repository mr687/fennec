import { Injectable } from '@nestjs/common'
import { ServiceContract } from 'src/shared'
import { User } from './modules/users/user.schema'
import { UserService } from './modules/users/user.service'
import { compare } from 'bcrypt'

interface IAuthService {
  validateAuthBasic(basicToken: { username: string; password: string }): Promise<User | undefined>
}

@Injectable()
export class AuthService extends ServiceContract implements IAuthService {
  public constructor(private userService: UserService) {
    super()
  }

  public async validateAuthBasic(basicToken: { username: string; password: string }): Promise<User | undefined> {
    const { username, password } = basicToken

    const existingUser = await this.userService.findByUsername(username)
    if (!existingUser) {
      return
    }

    const isPasswordMatches = await compare(password, existingUser.secretKey ?? '')
    if (!isPasswordMatches) {
      return
    }

    return existingUser
  }
}
