import { config, DIALECT } from '../../config';
import { Connection, createConnection } from 'typeorm';

const connection: Promise<Connection> = createConnection({
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
