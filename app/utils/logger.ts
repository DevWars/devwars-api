import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as winston from 'winston';
import { join } from 'path';

import { pathExists, canAccessPath } from '../../test/helpers';
dotenv.config();

const { colorize, combine, timestamp, printf, splat } = winston.format;
const logDirectory = join(__dirname, 'logs');

let consoleLoggingOnly = false;

if (!pathExists(logDirectory) && canAccessPath(logDirectory, fs.constants.R_OK | fs.constants.W_OK)) {
    fs.mkdirSync(logDirectory);
}

if (
    !canAccessPath(logDirectory, fs.constants.W_OK | fs.constants.R_OK) ||
    !canAccessPath(join(logDirectory, 'error.txt'), fs.constants.W_OK | fs.constants.R_OK)
) {
    consoleLoggingOnly = true;
}

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
 * with a timestamp, level and message. Designed to also handle cases
 * in which a error stack/message is involved.
 */
const myFormat = printf((info: any) => {
    let message = `${info.timestamp} ${info.level}: `;

    if (info instanceof Error) {
        message += ` ${info.stack}`;
    } else if (info.message instanceof Object) {
        message += JSON.stringify(info.message);
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
        new winston.transports.Console({
            format: combine(timestamp(), colorize(), splat(), myFormat),
            level: process.env.LOG_LEVEL || 'info',
        }),
    ],
});

if (!consoleLoggingOnly) {
    logger.add(new winston.transports.File({ filename: './logs/error.log', level: 'warn', maxsize: 2e6, maxFiles: 3 }));

    logger.add(
        new winston.transports.File({
            filename: './logs/all.log',
            level: process.env.LOG_LEVEL || 'info',
            maxsize: 2e6,
            maxFiles: 3,
        })
    );
}

if (consoleLoggingOnly) {
    logger.error(`Logger cannot read or write to directory ${join(__dirname, 'logs')}.`);
    logger.error('Logs will only be written to the console until the issue is resolved.');
}

export default logger;
