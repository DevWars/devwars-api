import * as fs from 'fs';
import * as winston from 'winston';

const { colorize, combine, timestamp, printf, splat } = winston.format;

if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');

const logLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        verbose: 3,
        debug: 4,
        silly: 5,
    },
};

/**
 * Defines a custom format with winston print-f, used for formatting
 * with a timestamp, level and message.
 */
const myFormat = printf((info) => {
    let message = `${info.timestamp} ${info.level}: `;

    if (info instanceof Error) {
        message += ` ${info.stack}`;
    } else {
        message += info.message;
    }

    return message;
});

/**
 * Creates a new logger that is exported, allows for logging directly
 * into the terminal and into two files, just errors and everything.
 */
const logger = winston.createLogger({
    levels: logLevels.levels,
    format: combine(timestamp(), splat(), myFormat),
    transports: [
        new winston.transports.File({ filename: './logs/error.log', level: 'warn', maxsize: 2000000 }),
        new winston.transports.File({ filename: './logs/all.log', maxsize: 2000000, maxFiles: 3 }),
    ],
});

logger.add(
    new winston.transports.Console({
        format: combine(timestamp(), colorize(), splat(), myFormat),
    })
);

export { logger };
export default logger;
