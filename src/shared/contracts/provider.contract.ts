export abstract class ProviderContract<Config = any> {
  public constructor(protected config: Config) {}
}
