import {
  ArgumentMetadata,
  HttpException,
  HttpStatus,
  Injectable,
  PipeTransform,
  ValidationError,
} from '@nestjs/common'
import { getMetadataStorage, validate } from 'class-validator'
import { plainToClass } from 'class-transformer'

@Injectable()
export class RequestValidation implements PipeTransform<unknown> {
  async transform(value: unknown, metadata: ArgumentMetadata) {
    if (value instanceof Object && this.isEmptyObject(value)) {
      throw new HttpException(
        'Validation Failed: No data submitted for body',
        HttpStatus.BAD_REQUEST,
      )
    }

    const { metatype } = metadata

    if (!metatype || !this.toValidate(metatype)) {
      return value
    }

    const object = plainToClass(metatype, value)
    const errors = await validate(object, { forbidUnknownValues: true })

    if (errors.length) {
      throw new HttpException(
        {
          errors: this.formatErrors(errors),
          message: 'Validation Failed',
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      )
    }

    const validatedValues = this.getValidatedValues(object, value)
    return validatedValues
  }

  private getValidatedValues(target: any, value: any) {
    const targetMetadatas = getMetadataStorage().getTargetValidationMetadatas(
      target.constructor,
      '',
      false,
      false,
    )
    const validatedValues: any = {}

    targetMetadatas.forEach(x => {
      const key = x.propertyName
      if (!validatedValues[key]) {
        validatedValues[key] = (value as any)[key]
      }
    })

    return validatedValues
  }

  private formatErrors(errors: ValidationError[]) {
    const errorsObj: Record<string, Record<string, string> | null> = {}

    const formatName = (name: string, parent?: string) => {
      if (parent) {
        return parent + '.' + name
      }
      return name
    }

    const getErrors = (errs: ValidationError[], parent?: string) => {
      errs.forEach(error => {
        const errorName = formatName(error.property, parent)
        if (error.constraints) {
          errorsObj[errorName] = error.constraints
        }

        if (error.children && error.children.length) {
          getErrors(error.children, errorName)
        }
      })
    }

    getErrors(errors)

    return errorsObj
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object]
    return !types.includes(metatype)
  }

  private isEmptyObject(value: object): boolean {
    return !Object.keys(value).length
  }
}
