import pino, { Logger } from 'pino'

export class UseLogger {
  private _logger: Logger

  protected name = 'DefaultLog'

  protected get log() {
    if (!this._logger) {
      this._logger = pino({
        name: this.name,
        level: 'debug',
      })
    }

    return this._logger
  }
}
