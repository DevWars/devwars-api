import { Connection as typeConnection } from 'typeorm';
import * as faker from 'faker';

import { Connection } from '../app/services/Connection.service';
import logger from '../app/utils/logger';
import User from '../app/models/User';

let connection: typeConnection;

const updateEmailAddress = async (): Promise<any> => {
    const users = await User.find();

    for (const user of users) {
        const profile = faker.helpers.createCard();
        user.email = `${profile.username}.${profile.email}`;
        await user.save();
    }
};

(async (): Promise<any> => {
    connection = await Connection;

    logger.info('Updating user emails');
    await updateEmailAddress();

    logger.info('Seeding complete');
    await connection.close();
})();
