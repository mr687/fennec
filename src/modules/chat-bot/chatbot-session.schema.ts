import { Prop, Schema } from '@nestjs/mongoose'
import { Contact } from '@whiskeysockets/baileys'
import { Exclude, Expose, Type } from 'class-transformer'
import { HydratedDocument, Types } from 'mongoose'

import { CustomSchemaFactory } from '@/shared/factory/schema.factory'

import { User } from '../auth/modules/users/user.schema'

export interface IChatBotSession {}

@Schema({
  timestamps: true,
})
@Exclude()
export class ChatBotSession implements IChatBotSession {
  @Expose({ name: '_id' })
  id: string

  @Prop({ required: true, unique: true })
  @Expose()
  name: string

  @Prop({ required: true })
  @Expose()
  sessionId: string

  @Prop({ required: true })
  @Expose()
  phone: string

  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  @Expose()
  @Type(() => User)
  owner?: User

  @Prop({ required: false, type: Object })
  @Expose()
  user?: Contact
}

export type ChatBotSessionDoc = HydratedDocument<ChatBotSession>
export const ChatBotSessionSchema = CustomSchemaFactory.createForClass(ChatBotSession)
