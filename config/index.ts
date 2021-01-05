import * as path from 'path';
import * as dotenv from 'dotenv';
import * as AWS from 'aws-sdk';
import { ConnectionOptions } from 'typeorm';

dotenv.config();

const booleanEnv = (value?: string): boolean => {
    return value?.toLowerCase() === 'true' ?? false;
}

const {
    NODE_ENV = 'development',
    PORT = '8000',
    HOST = '0.0.0.0',
    CORS_ORIGINS = '',
    AWS_ACCESS_KEY,
    AWS_SECRET_KEY,
}: { [key: string]: string | undefined } = process.env;

// Prefix for TypeORM environment variables.
// TODO: Test environment should use a separate .env.test file intead.
const TYPEORM = NODE_ENV === 'test' ? 'TYPEORM_TEST_' : 'TYPEORM_';

const {
    [TYPEORM + 'HOST']: TYPEORM_HOST,
    [TYPEORM + 'PORT']: TYPEORM_PORT,
    [TYPEORM + 'DATABASE']: TYPEORM_DATABASE,
    [TYPEORM + 'USERNAME']: TYPEORM_USERNAME,
    [TYPEORM + 'PASSWORD']: TYPEORM_PASSWORD,
    [TYPEORM + 'SYNCHRONIZE']: TYPEORM_SYNCHRONIZE = 'true',
    [TYPEORM + 'LOGGING']: TYPEORM_LOGGING = 'false',
}: { [key: string]: string | undefined } = process.env;

const databaseOptions: ConnectionOptions = {
    type: 'postgres',
    database: TYPEORM_DATABASE,
    host: TYPEORM_HOST,
    port: Number(TYPEORM_PORT),
    username: TYPEORM_USERNAME,
    password: TYPEORM_PASSWORD,
    synchronize: booleanEnv(TYPEORM_SYNCHRONIZE),
    logging: booleanEnv(TYPEORM_LOGGING),

    entities: [path.join(__dirname, '../app/models/*{.ts,.js}')],
};

const config = {
    env: NODE_ENV,
    port: Number(PORT),
    host: HOST,
    databaseOptions,
    cors: {
        credentials: true,
        origin: CORS_ORIGINS.split(' '),
    },
};

AWS.config.update({
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
});

export { config };
