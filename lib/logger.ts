import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino(
  isDev
    ? {
        level: process.env.LOG_LEVEL ?? 'debug',
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, ignore: 'pid,hostname' },
        },
      }
    : {
        level: process.env.LOG_LEVEL ?? 'info',
      },
);
