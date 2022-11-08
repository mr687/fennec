import { UseLogger } from './logger.contract'

export abstract class ProviderContract<Config = any> extends UseLogger {
  public constructor(protected config: Config) {
    super()
  }
}
