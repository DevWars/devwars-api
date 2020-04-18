export interface IProcessEnv {
    // #################################
    // # Master Configuration Options  #
    // #################################
    NODE_ENV: 'development' | 'production' | 'test';
    APP_PORT: string;

    // # `COOKIE_DOMAIN` Leave this blank unless you have a good understanding
    // # of a cookie domain and its functionality. Leaving blank will allow
    // # local development without any constraints.
    COOKIE_DOMAIN: string;
    API_KEY: string;

    DB_HOST: string;
    DB_PORT: string;
    DB_NAME: string;
    DB_USER: string;
    DB_PASS: string;

    FIREBASE_URL: string;

    FRONT_URL: string;
    API_URL: string;

    AUTH_SECRET: string;
    LOG_LEVEL: string;

    DISCORD_CLIENT: string;
    DISCORD_SECRET: string;

    TWITCH_CLIENT: string;
    TWITCH_SECRET: string;

    MAILGUN_KEY: string;

    AWS_ENDPOINT_URL: string;
    AWS_ACCESS_KEY: string;
    AWS_SECRET_KEY: string;
    AWS_BUCKET_NAME: string;

    // #################################
    // # Testing Configuration Options #
    // #################################
    TEST_DB_HOST: string;
    TEST_DB_PORT: string;
    TEST_DB_NAME: string;
    TEST_DB_USER: string;
    TEST_DB_PASS: string;
    // ...
}
