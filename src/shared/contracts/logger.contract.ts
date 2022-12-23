import { Logger, pino } from 'pino'

export class UseLogger {
  private _logger: Logger

  protected name = 'DefaultLog'

  protected get log() {
    if (!this._logger) {
      this._logger = pino({
        name: this.name,
        level: process.env.APP_LEVEL ?? 'debug',
      })
    }

    return this._logger
  }
}
