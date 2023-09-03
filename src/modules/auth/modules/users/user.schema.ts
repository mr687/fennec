import { Prop, Schema } from '@nestjs/mongoose'
import { Exclude, Expose } from 'class-transformer'
import { HydratedDocument } from 'mongoose'

import { CustomSchemaFactory } from '@/shared/factory/schema.factory'

import { UserDto, UserType } from './dto/user.dto'

@Schema({ timestamps: true })
@Exclude()
export class User implements UserDto {
  @Expose({ name: '_id' })
  id: string

  @Prop({ required: true })
  @Expose()
  name: string

  @Prop({ required: true, unique: true })
  @Expose()
  email: string

  @Prop({ required: true })
  @Exclude()
  password: string

  @Prop({ require: true })
  @Exclude()
  secretKey: string

  @Prop({ require: true, default: false })
  @Expose()
  confirmed: boolean

  @Prop({
    required: true,
    type: String,
    enum: UserType,
    default: UserType.Client,
  })
  @Expose()
  type: UserType
}
export type UserDoc = HydratedDocument<User>
export const UserSchema = CustomSchemaFactory.createForClass(User)
