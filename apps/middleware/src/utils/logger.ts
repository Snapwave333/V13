import winston from 'winston';

const logFormat = winston.format.printf(({ level, message, timestamp, service, ...meta }) => {
  return `${timestamp} [${service}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'vibes-middleware' },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' 
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            logFormat
          )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
