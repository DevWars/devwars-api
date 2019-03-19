import { env } from 'process';

export const DIALECT = 'postgres';

const LOCAL_CONFIGURATION = {
    DB: env.DB || 'devwars-test',
    PASSWORD: env.PASSWORD || 'secret',
    PORT_DB: 5432,
    SERVER: env.SERVER || '127.0.0.1',
    USER_DB: 'postgres',
};

const PRODUCTION_CONFIGURATION = {
    DB: env.DB || 'prod',
    PASSWORD: env.PASSWORD || '',
    PORT_DB: Number(env.PORT_DB) || 5432,
    SERVER: env.SERVER || 'localhost',
    USER_DB: env.USER_DB || 'postgres',
};

export const config = {
    DATABASE: env.NODE_ENV === 'PRODUCTION' ? PRODUCTION_CONFIGURATION : LOCAL_CONFIGURATION,
    PORT_APP: 1344,
    SECRET: 'HltH3R3',
};
