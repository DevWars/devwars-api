export const DIALECT = 'postgres';

const LOCAL_CONFIGURATION = {
    SERVER: process.env.SERVER || '127.0.0.1',
    PORT: Number(process.env.PORT_DB) || 5432,
    DB: process.env.DB || 'devwars_local',
    USER: process.env.USER_DB || 'postgres',
    PASSWORD: process.env.PASSWORD || 'secret',
};

const PRODUCTION_CONFIGURATION = {
    SERVER: process.env.SERVER || 'localhost',
    PORT: Number(process.env.PORT_DB) || 5432,
    DB: process.env.DB || 'devwars',
    USER: process.env.USER_DB || 'postgres',
    PASSWORD: process.env.PASSWORD || 'secret',
};

const TEST_CONFIGURATION = {
    SERVER: process.env.SERVER || 'localhost',
    PORT: Number(process.env.PORT_DB) || 5432,
    DB: process.env.DB || 'devwars_test',
    USER: process.env.USER_DB || 'postgres',
    PASSWORD: process.env.PASSWORD || 'secret',
};

const mask: any = {
    LOCAL: LOCAL_CONFIGURATION,
    PRODUCTION: PRODUCTION_CONFIGURATION,
    test: TEST_CONFIGURATION,
};

export const config = {
    DATABASE: mask[process.env.NODE_ENV] || mask.LOCAL,
    PORT_APP: 8080,
};
