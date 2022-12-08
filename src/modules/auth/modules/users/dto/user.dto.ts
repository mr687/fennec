export enum UserType {
  Client = 'CLIENT',
  Admin = 'ADMIN',
}

export interface UserDto {
  name: string
  email: string
  password: string
  secretKey: string
  type: UserType
}
