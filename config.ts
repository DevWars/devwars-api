import { env } from 'process';

export const DIALECT = 'postgres';

const LOCAL_CONFIGURATION = {
    SERVER: env.SERVER || '127.0.0.1',
    PORT: Number(env.PORT_DB) || 5432,
    DB: env.DB || 'devwars_local', // TODO: maybe here it should devwars_local
    USER: env.USER_DB || 'postgres',
    PASSWORD: env.PASSWORD || 'secret',
};

const PRODUCTION_CONFIGURATION = {
    SERVER: env.SERVER || 'localhost',
    PORT: Number(env.PORT_DB) || 5432,
    DB: env.DB || 'devwars', // TODO: maybe here it should devwars_production
    USER: env.USER_DB || 'postgres',
    PASSWORD: env.PASSWORD || 'secret',
};

const TEST_CONFIGURATION = {
    SERVER: env.SERVER || 'localhost',
    PORT: Number(env.PORT_DB) || 5433,
    DB: env.DB || 'devwars_test',
    USER: env.USER_DB || 'postgres',
    PASSWORD: env.PASSWORD || 'secret',
}


const mask: any = {
    'LOCAL': LOCAL_CONFIGURATION,
    'PRODUCTION': PRODUCTION_CONFIGURATION,
    'test': TEST_CONFIGURATION
}

export const config = {
    DATABASE: mask[env.NODE_ENV] || mask.LOCAL,
    PORT_APP: 8080,
    SECRET: 'HltH3R3',
};