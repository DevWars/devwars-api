import * as dotenv from 'dotenv';
import * as cluster from 'cluster';
import { cpus } from 'os';

import Server from './services/Server.service';
import { config } from '../config';

// tslint:disable-next-line: no-var-requires
const project = require('../package');

dotenv.config();

/**
 * Called when a error occurring within the http server.
 * @param {Error} error The error that occurred.
 */
const handleServerError = (error: any) => {
    if (error.syscall !== 'listen') throw error;

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
};

const handleListening = (name: string, version: string, port: number) => () => {
    console.log(`${name} | version: ${version} | process: ${process.pid} | port: ${port} | ${process.env.NODE_ENV}`);
};

if (process.env.NODE_ENV === 'production' && cluster.isMaster) {
    console.log(`\n-------------------> RUN ${process.env.NODE_ENV} ENVIRONMENT\n`);

    for (const cpu of cpus()) cluster.fork();

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal: ${signal}`);
        console.log('Starting a new worker');
        cluster.fork();
    });
} else {
    const port: number = Number(process.env.PORT) || config.PORT_APP || 8080;
    const applicationServer = new Server();

    applicationServer.Start().then((server) => {
        server.listen(port);

        server.on('error', handleServerError);
        server.on('listening', handleListening(project.name, project.version, port));
    });
}
