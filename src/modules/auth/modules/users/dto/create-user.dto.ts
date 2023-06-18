import {IsEmail, IsString, MaxLength, MinLength} from 'class-validator'

import {UserDto, UserType} from './user.dto'

export class CreateUserDto implements UserDto {
  @IsString()
  @MaxLength(50)
  name: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string

  secretKey: string

  type: UserType
}
