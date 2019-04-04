import { Connection, createConnection } from 'typeorm';
import { config, DIALECT } from '../config';

import Activity from '../app/models/Activity';
import EmailVerification from '../app/models/EmailVerification';
import Game from '../app/models/Game';
import GameSchedule from '../app/models/GameSchedule';
import GameApplication from '../app/models/GameApplication';
import LinkedAccount from '../app/models/LinkedAccount';
import PasswordReset from '../app/models/PasswordReset';
import UserGameStats from '../app/models/UserGameStats';
import UserStats from '../app/models/UserStats';
import UserProfile from '../app/models/UserProfile';
import User from '../app/models/User';

const entities = {
    Activity,
    EmailVerification,
    Game,
    GameSchedule,
    GameApplication,
    LinkedAccount,
    PasswordReset,
    UserGameStats,
    UserStats,
    UserProfile,
    User,
};
// @ts-ignore
const allEntities = Object.keys(entities).map((it) => entities[it]);

let connection: Promise<Connection>;

connection = createConnection({
    entities: allEntities,
    type: DIALECT,
    database: config.DATABASE.DB,
    host: config.DATABASE.SERVER,
    port: config.DATABASE.PORT,
    username: config.DATABASE.USER,
    password: config.DATABASE.PASSWORD,
    logging: false,
});

export { connection as Connection };
