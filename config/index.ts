import * as dotenv from 'dotenv';
import * as AWS from 'aws-sdk';

dotenv.config();

const DIALECT: any = process.env.DIALECT || 'postgres';

const LOCAL_CONFIGURATION = {
    HOST: process.env.DB_HOST,
    PORT: process.env.DB_PORT,
    NAME: process.env.DB_NAME,
    USER: process.env.DB_USER,
    PASS: process.env.DB_PASS,
};

const PRODUCTION_CONFIGURATION = {
    HOST: process.env.DB_HOST,
    PORT: process.env.DB_PORT,
    NAME: process.env.DB_NAME,
    USER: process.env.DB_USER,
    PASS: process.env.DB_PASS,
};

const config = {
    DATABASE: process.env.NODE_ENV === 'PRODUCTION' ? PRODUCTION_CONFIGURATION : LOCAL_CONFIGURATION,
    PORT_APP: Number(process.env.APP_PORT),
};

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
});

export { DIALECT, config };
