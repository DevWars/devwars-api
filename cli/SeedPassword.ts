import * as typeorm from 'typeorm';
import { getCustomRepository } from 'typeorm';

import { Connection } from '../app/services/connection.service';
import UserRepository from '../app/repository/User.repository';
import { hash } from '../app/utils/hash';
import User from '../app/models/User';

let connection: typeorm.Connection;

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

    console.log('Updating user passwords');
    await updateUserPasswords();

    console.log('Seeding complete');
    await connection.close();
})();
