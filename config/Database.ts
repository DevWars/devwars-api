import { Connection, createConnection } from 'typeorm';
import { config, DIALECT } from '../config';

import * as entities from '../app/models';

// @ts-ignore
const allEntities = Object.keys(entities).map((it) => entities[it]);

let connection: Promise<Connection>;

if (process.env.NODE_ENV === 'test') {
    // Create a test connection to sqlite to keep tests fast
    // and without a MySql instance

    connection = createConnection({
        entities: allEntities,

        database: './db.sqlite',
        dropSchema: true,
        type: 'sqlite',
    });
} else {
    connection = createConnection({
        entities: allEntities,

        database: config.DATABASE.DB,
        host: config.DATABASE.SERVER,
        logging: 'all',
        password: config.DATABASE.PASSWORD,
        port: config.DATABASE.PORT_DB,
        type: DIALECT,
        username: config.DATABASE.USER_DB,
    });
}

export { connection as Connection };
