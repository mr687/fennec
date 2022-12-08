import { User, UserSchema } from './user.schema'

import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { hash } from 'bcrypt'

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
