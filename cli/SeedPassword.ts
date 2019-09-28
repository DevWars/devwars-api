import * as typeorm from 'typeorm';
import { getCustomRepository } from 'typeorm';

import { Connection } from '../config/Database';
import { UserRole } from '../app/models/User';
import User from '../app/models/User';
import UserRepository from '../app/repository/User.repository';
import { hash } from '../app/utils/hash';

let connection: typeorm.Connection;
let connectionManager: typeorm.EntityManager;

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
    connectionManager = typeorm.getManager(connection.name);

    console.log('Updating user passwords');
    await updateUserPasswords();

    console.log('Seeding complete');
    await connection.close();
})();
