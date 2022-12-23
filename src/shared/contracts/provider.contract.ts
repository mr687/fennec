import { UseLogger } from './logger.contract'

export abstract class ProviderContract<Config = any> {
  public constructor(protected config: Config) {}
}
