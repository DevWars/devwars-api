import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as http from 'http';
import * as methodOverride from 'method-override';
import * as morgan from 'morgan';
import { Connection } from './Database';
import { ROUTER } from './Router';

export class Server {
    private static async ConnectDB(): Promise<any> {
        const connection = await Connection;

        try {
            await connection.synchronize();
        } catch (e) {
            console.log(e);
            console.log("Couldn't synchronize database");
        }

        return connection;
    }

    private readonly app: express.Application;
    private readonly server: http.Server;

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
    }

    public Start(): Promise<http.Server> {
        return Server.ConnectDB().then(() => {
            this.ExpressConfiguration();
            this.ConfigurationRouter();
            return this.server;
        });
    }

    public App(): express.Application {
        return this.app;
    }

    private ExpressConfiguration(): void {
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json({ limit: '50mb' }));
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
        for (const route of ROUTER) {
            this.app.use(route.path, route.middleware, route.handler);
        }

        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            return res.status(404).json({ error: 'Not found' });
        });

        this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (err.name === 'UnauthorizedError') {
                return res.status(401).json({ error: 'Please send a valid Token...' });
            }

            return next();
        });

        this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            return res.status(err.status || 500).json({ error: err.message });
        });
    }
}
