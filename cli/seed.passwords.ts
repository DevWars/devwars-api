import { Connection as typeConnection } from 'typeorm';

import { Connection } from '../app/services/Connection.service';
import { hash } from '../app/utils/hash';
import logger from '../app/utils/logger';
import User from '../app/models/user.model';

let connection: typeConnection;

const updateUserPasswords = async (): Promise<any> => {
    const users = await User.find();

    for (const user of users) {
        user.password = await hash('secret');
        await user.save();
    }
};

(async (): Promise<any> => {
    connection = await Connection;

    logger.info('Updating user passwords');
    await updateUserPasswords();

    logger.info('Seeding complete');
    await connection.close();
})();
