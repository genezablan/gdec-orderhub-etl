import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Logger, createLogger, format, transports } from 'winston';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggingService implements LoggerService {
  private logger: Logger;

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    const environment = this.configService.get('NODE_ENV') || 'development';
    const serviceName = this.configService.get('SERVICE_NAME') || 'unknown-service';

    this.logger = createLogger({
      level: environment === 'development' ? 'debug' : 'info',
      defaultMeta: { 
        service: serviceName,
        environment
      },
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
      ),
      transports: [
        // Always log to console
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ level, message, timestamp, ...metadata }) => {
              return `[${timestamp}] ${level}: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : ''}`;
            })
          )
        }),
        // In production, also log to file
        ...(environment === 'production' ? [
          new transports.File({ 
            filename: `logs/${serviceName}-error.log`, 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new transports.File({ 
            filename: `logs/${serviceName}-combined.log`,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          })
        ] : [])
      ]
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
