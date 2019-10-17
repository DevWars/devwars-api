import * as dotenv from 'dotenv';
import * as AWS from 'aws-sdk';
import { isNil } from 'lodash';

dotenv.config();

const DIALECT: any = process.env.DIALECT || 'postgres';
const environment = process.env.NODE_ENV;

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
    PORT_APP: Number(process.env.APP_PORT),
};

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
});

export { DIALECT, config };
