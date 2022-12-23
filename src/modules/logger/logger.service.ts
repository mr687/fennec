import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common'
import { isPlainObject } from 'lodash'
import { LevelWithSilent, Logger, destination, pino } from 'pino'

@Injectable()
export class LoggerService extends ConsoleLogger {
  protected logger: Logger

  public constructor(context?: string) {
    super(context ?? LoggerService.name)

    this.logger = pino({
      level: process.env.APP_LEVEL ?? 'level',
    })
  }

  public info(...args: any[]) {
    this.printMessages([...args], this.context, 'log')
  }

  public file(id: string, ...args: any[]) {
    const filePath = process.env.APP_LOGGING_PATH ?? '.'
    const fileName = `${filePath}/${id}.ndjson`
    const logger = pino(
      {
        level: 'info',
      },
      destination({
        dest: fileName,
        sync: false,
      }),
    )

    logger.info(args.shift(), ...args)
  }

  protected printMessages(
    messages: unknown[],
    context?: string,
    logLevel: LogLevel = 'log',
    writeStreamType?: 'stdout' | 'stderr' | undefined,
  ): void {
    const level = this.mapLogLevel(logLevel)

    messages.forEach(message => {
      const pidMessage = `[JIGA][${process.pid}]`
      const contextMessage = `[${this.context}]`
      const formattedLogLevel = `[${level.toUpperCase()}]`
      const formattedMessage = this.formatMessage(
        level as any,
        message,
        pidMessage,
        formattedLogLevel,
        contextMessage,
        '',
      )

      this.logger[level](formattedMessage)
    })
  }

  protected formatMessage(
    logLevel: LogLevel,
    message: unknown,
    pidMessage: string,
    formattedLogLevel: string,
    contextMessage: string,
    timestampDiff: string,
  ): string {
    const stringifyMessage =
      isPlainObject(message) || Array.isArray(message)
        ? JSON.stringify(message, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2)
        : `${message}`
    return `${pidMessage}${formattedLogLevel}${contextMessage} ${stringifyMessage}`
  }

  private mapLogLevel(logLevel: LogLevel): LevelWithSilent {
    const mapOverride = {
      log: 'info',
      verbose: 'trace',
    }
    return (mapOverride[logLevel as keyof typeof mapOverride] ?? logLevel) as LevelWithSilent
  }
}
