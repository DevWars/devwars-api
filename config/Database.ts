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

// if (process.env.NODE_ENV === 'test') {
//     // Create a test connection to sqlite to keep tests fast
//     connection = createConnection({
//         entities: allEntities,

//         database: './db.sqlite',
//         dropSchema: true,
//         type: 'sqlite',
//     });
// } else {
connection = createConnection({
    entities: allEntities,
    database: config.DATABASE.DB,
    host: config.DATABASE.SERVER,
    logging: false,
    password: config.DATABASE.PASSWORD,
    port: config.DATABASE.PORT,
    type: DIALECT,
    username: config.DATABASE.USER,
});
// }

export { connection as Connection };
