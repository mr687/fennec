import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { CustomSchemaFactory } from 'src/shared/factory/schema.factory'
import { IWhatsappSession } from './dto/whatsapp-session.dto'

@Schema({
  timestamps: true,
})
export class WhatsappSession implements IWhatsappSession {
  @Prop({ required: true, unique: true })
  name: string

  @Prop({ required: false })
  jid: string

  @Prop({ required: false })
  username: string

  @Prop({ required: false })
  imgUrl: string
}

export type WhatsappSessionDoc = HydratedDocument<WhatsappSession>
export const WhatsappSessionSchema = CustomSchemaFactory.createForClass(WhatsappSession)
