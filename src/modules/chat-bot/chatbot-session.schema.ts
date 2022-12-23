import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

import { CustomSchemaFactory } from 'src/shared/factory/schema.factory'

export interface IChatBotSession {}

@Schema({
  timestamps: true,
})
export class ChatBotSession implements IChatBotSession {
  @Prop({ required: true, unique: true })
  name: string
}

export type ChatBotSessionDoc = HydratedDocument<ChatBotSession>
export const ChatBotSessionSchema = CustomSchemaFactory.createForClass(ChatBotSession)
