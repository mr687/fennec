import { Prop, Schema } from '@nestjs/mongoose'
import { UserDto, UserType } from './dto/user.dto'

import { CustomSchemaFactory } from 'src/shared/factory/schema.factory'
import { HydratedDocument } from 'mongoose'

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

  @Prop({ required: true, enum: UserType, default: UserType.Client })
  type: UserType = UserType.Client
}
export type UserDoc = HydratedDocument<User>
export const UserSchema = CustomSchemaFactory.createForClass(User)
