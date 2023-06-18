import {Prop, Schema} from '@nestjs/mongoose'
import {Contact} from '@whiskeysockets/baileys'
import {HydratedDocument, Types} from 'mongoose'

import {CustomSchemaFactory} from '@/shared/factory/schema.factory'

import {User} from '../auth/modules/users/user.schema'

export interface IChatBotSession {}

@Schema({
  timestamps: true,
})
export class ChatBotSession implements IChatBotSession {
  @Prop({required: true, unique: true})
  name: string

  @Prop({required: true})
  sessionId: string

  @Prop({required: true})
  phone: string

  @Prop({required: false, type: Types.ObjectId, ref: 'User'})
  owner?: User

  @Prop({required: false, type: Object})
  user?: Contact
}

export type ChatBotSessionDoc = HydratedDocument<ChatBotSession>
export const ChatBotSessionSchema =
  CustomSchemaFactory.createForClass(ChatBotSession)
