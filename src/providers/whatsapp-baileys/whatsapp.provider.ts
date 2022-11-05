import { Injectable } from '@nestjs/common'
import { ProviderContract } from '../provider.contract'

@Injectable()
export class WhatsappProvider extends ProviderContract {}
