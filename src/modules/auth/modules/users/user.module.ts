import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { hash } from 'bcrypt'

import { UserController } from './user.controller'
import { User, UserSchema } from './user.schema'
import { UserService } from './user.service'

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: User.name,
        useFactory: () => {
          const userSchema = UserSchema
          userSchema.pre('save', async function (next) {
            this.password = await hash(this.password, 10)
            if (this.secretKey) {
              this.secretKey = await hash(this.secretKey, 10)
            }
            next()
          })
          return userSchema
        },
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
