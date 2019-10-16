import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as http from 'http';
import * as methodOverride from 'method-override';
import * as morgan from 'morgan';
import { Routes } from '../routes';

import * as Connection from './Connection.service';

export default class ServerService {
    public static async ConnectToDatabase() {
        try {
            const connection = await Connection.Connection;
            await connection.query('select 1+1 as answer');
            await connection.synchronize();
        } catch (error) {
            console.log(`Failed to connect to database, ${error}`);
        }
    }

    private readonly app: express.Application;
    private readonly server: http.Server;

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
    }

    public async Start() {
        await ServerService.ConnectToDatabase();
        this.ExpressConfiguration();
        this.ConfigurationRouter();
        return this.server;
    }
    public App(): express.Application {
        return this.app;
    }

    private ExpressConfiguration(): void {
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json({ limit: '10mb' }));
        this.app.use(methodOverride());
        this.app.use(cookieParser());

        this.app.use((req, res, next): void => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS');
            next();
        });

        this.app.use(morgan('combined'));
        this.app.use(
            cors({
                credentials: true,
                origin: process.env.FRONT_URL || 'http://localhost:3000',
            })
        );

        this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction): void => {
            err.status = 404;
            next(err);
        });
    }

    private ConfigurationRouter(): void {
        for (const route of Routes) {
            this.app.use(route.path, route.middleware, route.handler);
        }

        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            return res.status(404).json({ error: 'Not found.' });
        });

        this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            return res.status(err.status || 500).json({ error: err.message });
        });
    }
}
