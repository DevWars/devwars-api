import { getCustomRepository, Connection as typeConnection } from 'typeorm';

import { Connection } from '../app/services/Connection.service';
import UserRepository from '../app/repository/User.repository';
import { hash } from '../app/utils/hash';
import logger from '../app/utils/logger';
import User from '../app/models/User';

let connection: typeConnection;

// Converts all user passwords to "secret" (for development use)
const updateUserPasswords = async () => {
    const users = await User.find();

    for (const user of users) {
        const userRepository = getCustomRepository(UserRepository);

        await userRepository.findByUsername(user.username);
        user.password = await hash('secret');

        await user.save();
    }
};

(async () => {
    connection = await Connection;

    logger.info('Updating user passwords');
    await updateUserPasswords();

    logger.info('Seeding complete');
    await connection.close();
})();
