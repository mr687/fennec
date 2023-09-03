import { Type } from '@nestjs/common'
import { SchemaFactory } from '@nestjs/mongoose'
import { Model, Schema } from 'mongoose'

export class CustomSchemaFactory extends SchemaFactory {
  static createForClass<TClass = any>(target: Type<TClass>): Schema<TClass, Model<TClass>> {
    const schema = super.createForClass(target)
    schema.set('toJSON', { getters: true, virtuals: true })
    return schema
  }
}
