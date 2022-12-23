import { Type } from '@nestjs/common'
import { SchemaFactory } from '@nestjs/mongoose'
import { Model, Schema } from 'mongoose'
import * as mongooseHiddenPlugin from 'mongoose-hidden'

export class CustomSchemaFactory extends SchemaFactory {
  static createForClass<TClass = any>(target: Type<TClass>): Schema<TClass, Model<TClass>> {
    const schema = super.createForClass(target)

    schema.set('toJSON', { getters: true, virtuals: true })
    schema.plugin(mongooseHiddenPlugin(), {
      hidden: {
        password: true,
      },
    })

    return schema
  }
}
