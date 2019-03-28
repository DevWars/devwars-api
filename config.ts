import { env } from 'process';

export const DIALECT = 'postgres';

const LOCAL_CONFIGURATION = {
    SERVER: env.SERVER || '127.0.0.1',
    PORT: Number(env.PORT_DB) || 5432,
    DB: env.DB || 'devwars',
    USER: env.USER_DB || 'postgres',
    PASSWORD: env.PASSWORD || 'secret',
};

const PRODUCTION_CONFIGURATION = {
    SERVER: env.SERVER || 'localhost',
    PORT: Number(env.PORT_DB) || 5432,
    DB: env.DB || 'devwars',
    USER: env.USER_DB || 'postgres',
    PASSWORD: env.PASSWORD || 'secret',
};

export const config = {
    DATABASE: env.NODE_ENV === 'PRODUCTION' ? PRODUCTION_CONFIGURATION : LOCAL_CONFIGURATION,
    PORT_APP: 8080,
    SECRET: 'HltH3R3',
};
