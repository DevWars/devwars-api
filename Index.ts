import * as dotenv from 'dotenv';
dotenv.config();

import * as cluster from 'cluster';
import { cpus } from 'os';
import { config } from './config';
import { Server } from './config/Server';

import './config/S3';

if (cluster.isMaster) {
    console.log(`\n -------------------> RUN ${process.env.NODE_ENV} ENVIRONMENT \n`);

    for (const cpu of cpus()) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        console.log('Starting a new worker');
        cluster.fork();
    });
} else {
    const port: number = Number(process.env.PORT) || config.PORT_APP || 8080;

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
            console.log('Server is running in process ' + process.pid + ' listening on PORT ' + port + '\n');
        });
    });
}
