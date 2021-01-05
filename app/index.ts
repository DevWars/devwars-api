import * as dotenv from 'dotenv';
import logger from './utils/logger';
import Server from './services/server.service';
import { config } from '../config';

dotenv.config();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

/**
 * Called when a error occurring within the http server.
 * @param {Error} error The error that occurred.
 */
const handleServerError = (error: any) => {
    if (error.syscall !== 'listen') throw error;

    switch (error.code) {
        case 'EACCES':
            logger.error('Port requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error('Port is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
};

(async () => {
    const appServer = new Server();
    const server = await appServer.Start();

    server.on('error', handleServerError);

    server.listen(config.PORT, config.HOST, () => {
        logger.info([
            `${packageJson.name} v${packageJson.version}`,
            process.env.NODE_ENV,
            `listening: http://${config.HOST}:${config.PORT}`,
            `pid: ${process.pid}`,
        ].join(' | '));
    });
})();
