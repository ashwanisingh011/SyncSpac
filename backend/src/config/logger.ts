import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: { service: 'taskbridge-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          return `[${String(timestamp)}] ${level}: ${message}${stack ? `\n${String(stack)}` : ''}`;
        })
      )
    }),
    new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      level: 'info'
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      level: 'error'
    }),
    new DailyRotateFile({
      filename: 'logs/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      level: 'warn' // Security warnings/failures will be logged here at level 'warn' or above
    })
  ]
});

export default logger;
