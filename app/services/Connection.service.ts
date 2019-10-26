import * as dotenv from 'dotenv';

import { config, DIALECT } from '../../config';
import { Connection, createConnection } from 'typeorm';

dotenv.config();

let connection: Promise<Connection>;
connection = createConnection({
    entities: [__dirname + '/../models/*{.ts,js}'],
    type: DIALECT,
    database: config.DATABASE.NAME,
    host: config.DATABASE.HOST,
    port: Number(config.DATABASE.PORT),
    username: config.DATABASE.USER,
    password: config.DATABASE.PASS,
    logging: false,
});

export { connection as Connection };
