import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(
      colorize(),
      printf(({ level, message, timestamp: ts }) => `${ts} [${level}]: ${message}`)
    ),
  }),
];

if (env.nodeEnv !== 'production') {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

export const logger = winston.createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp: ts, stack }) => `${ts} [${level}]: ${stack || message}`)
  ),
  transports,
});