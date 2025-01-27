import path from 'path'

import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Set colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
}

// Apply colors to Winston
winston.addColors(logColors)

// Common log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, label, stack }) => {
    return `${timestamp} [${label}] ${level.toUpperCase()}: ${stack || message}`
  })
)

// Function to create a new logger instance for each module
const createLogger = (moduleName: string) => {
  return winston.createLogger({
    levels: logLevels,
    format: winston.format.combine(
      winston.format.label({ label: moduleName }),
      winston.format.errors({ stack: true }),
      logFormat
    ),
    transports: [
      new winston.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
        format: winston.format.combine(winston.format.colorize(), logFormat),
      }),
      new DailyRotateFile({
        level: 'info',
        filename: path.join(__dirname, `../../logs/${moduleName}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      }),
      new DailyRotateFile({
        level: 'error',
        filename: path.join(__dirname, `../../logs/${moduleName}-errors-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
      }),
    ],
    exitOnError: false,
  })
}

export const logger = {
  get: (moduleName: string) => createLogger(moduleName),
}
