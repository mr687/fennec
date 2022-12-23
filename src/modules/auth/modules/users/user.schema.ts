import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

import { CustomSchemaFactory } from 'src/shared/factory/schema.factory'

import { UserDto, UserType } from './dto/user.dto'

@Schema({ timestamps: true })
export class User implements UserDto {
  @Prop({ required: true })
  name: string

  @Prop({ required: true, unique: true })
  email: string

  @Prop({ required: true })
  password: string

  @Prop({ require: true, hideJSON: true })
  secretKey: string

  @Prop({ require: true, default: false })
  confirmed: boolean

  @Prop({ required: true, type: String, enum: UserType, default: UserType.Client })
  type: UserType
}
export type UserDoc = HydratedDocument<User>
export const UserSchema = CustomSchemaFactory.createForClass(User)
