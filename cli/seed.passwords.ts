import { Connection as typeConnection } from 'typeorm';

import { Connection } from '../app/services/Connection.service';
import { hash } from '../app/utils/hash';
import logger from '../app/utils/logger';
import User from '../app/models/User';

let connection: typeConnection;

const updateUserPasswords = async (): Promise<any> => {
    const users = await User.find();

    const password = await hash('secret');

    let count = 0;

    for (const user of users) {
        count += 1;

        process.stdout.cursorTo(0);
        process.stdout.write(`updating ${count}/${users.length} users`);

        user.password = password;
        await user.save();
    }

    process.stdout.write('\n');
};

(async (): Promise<any> => {
    connection = await Connection;

    logger.info('Updating user passwords');
    await updateUserPasswords();

    logger.info('Seeding complete');
    await connection.close();
})();
