import * as dotenv from 'dotenv';
import { Connection, createConnection } from 'typeorm';
dotenv.config();

const dbConfig = {
    HOST: process.env.DB_HOST,
    PORT: process.env.DB_PORT,
    NAME: process.env.DB_NAME,
    USER: process.env.DB_USER,
    PASS: process.env.DB_PASS,
};

let connection: Promise<Connection>;
connection = createConnection({
    entities: [__dirname + '/../app/models/*{.ts,.js}'],
    type: 'postgres',
    database: dbConfig.NAME,
    host: dbConfig.HOST,
    port: Number(dbConfig.PORT),
    username: dbConfig.USER,
    password: dbConfig.PASS,
    logging: false,
});

export { connection as Connection };
