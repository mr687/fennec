import { IsEmail, IsString, MaxLength } from 'class-validator'

import { UserDto, UserType } from './user.dto'

export class CreateUserDto implements UserDto {
  @IsString()
  @MaxLength(50)
  name: string

  @IsEmail()
  email: string

  password: string
  secretKey: string
  type: UserType
}
