import * as dotenv from 'dotenv';
import logger from './utils/logger';

dotenv.config();

import * as cluster from 'cluster';
import { cpus } from 'os';
import { Server } from '../config/Server';

import '../config/S3';

if (cluster.isMaster && process.env.NODE_ENV === 'production') {
    logger.info(`\n -------------------> RUN ${process.env.NODE_ENV} ENVIRONMENT \n`);

    for (const cpu of cpus()) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        logger.info('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        logger.info('Starting a new worker');
        cluster.fork();
    });
} else {
    const port: number = Number(process.env.APP_PORT) || 8080;

    new Server().Start().then((server) => {
        server.listen(port);

        server.on('error', (error: any) => {
            if (error.syscall !== 'listen') {
                throw error;
            }

            switch (error.code) {
                case 'EACCES':
                    console.error('Port requires elevated privileges');
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    console.error('Port is already in use');
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });

        server.on('listening', () => {
            logger.info('Server is running in process ' + process.pid + ' listening on PORT ' + port + '\n');
        });
    });
}
