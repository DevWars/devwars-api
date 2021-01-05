import * as dotenv from 'dotenv';
import * as AWS from 'aws-sdk';
import { isNil, defaultTo } from 'lodash';

dotenv.config();

const DIALECT: any = defaultTo(process.env.DIALECT, 'postgres');
const environment = defaultTo(process.env.NODE_ENV, 'production');

const TEST_CONFIGURATION = {
    HOST: process.env.TEST_DB_HOST,
    PORT: process.env.TEST_DB_PORT,
    NAME: process.env.TEST_DB_NAME,
    USER: process.env.TEST_DB_USER,
    PASS: process.env.TEST_DB_PASS,
};

const MASTER_CONFIGURATION = {
    HOST: process.env.DB_HOST,
    PORT: process.env.DB_PORT,
    NAME: process.env.DB_NAME,
    USER: process.env.DB_USER,
    PASS: process.env.DB_PASS,
};

const config = {
    DATABASE: !isNil(environment) && environment === 'test' ? TEST_CONFIGURATION : MASTER_CONFIGURATION,
    PORT: Number(process.env.PORT ?? 8000),
    HOST: process.env.HOST ?? '0.0.0.0',
};

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
});

export { DIALECT, config };
