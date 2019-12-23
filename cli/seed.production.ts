import * as typeorm from 'typeorm';
import { randomBytes } from 'crypto';

import UserProfileSeeding from '../app/seeding/UserProfile.seeding';
import UserStatsSeeding from '../app/seeding/UserStats.seeding';
import UserSeeding from '../app/seeding/User.seeding';

import User, { UserRole } from '../app/models/User';
import UserProfile from '../app/models/UserProfile';
import UserStats from '../app/models/UserStats';
import UserGameStats from '../app/models/UserGameStats';

import { AuthService } from '../app/services/Auth.service';
import { Connection } from '../app/services/Connection.service';
import { COMPETITOR_USERNAME } from '../app/constants';
import logger from '../app/utils/logger';
import { hash } from '../app/utils/hash';

let connection: typeorm.Connection;
let connectionManager: typeorm.EntityManager;

/**
 * Generates a random 48 bytes and returns this as a give hex string which will be used as a
 * randomized password for constant users generated for the production system. Since they will be
 * logged into, password should be unknown.
 */
async function generateRandomPassword(): Promise<string> {
    return new Promise((resolve, reject) => {
        randomBytes(48, (err, buffer) => {
            if (err) reject(err);
            resolve(buffer.toString('hex'));
        });
    });
}

const generateConstantUsers = async () => {
    for (const user of [{ username: COMPETITOR_USERNAME, email: 'contact' }]) {
        const password = await generateRandomPassword();

        const constantUser = new User(user.username, await hash(password), `${user.email}@devwars.tv`, UserRole.USER);

        const profile = new UserProfile(constantUser);
        profile.skills = { html: 1, css: 1, js: 1 };

        const userStats = new UserStats(constantUser);
        const gameStats = new UserGameStats(constantUser);

        await connectionManager.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.save(constantUser);
            await transactionalEntityManager.save(profile);
            await transactionalEntityManager.save(userStats);
            await transactionalEntityManager.save(gameStats);
        });
    }
};

(async () => {
    connection = await Connection;
    connectionManager = typeorm.getManager(connection.name);

    logger.info('Seeding database');
    logger.info('Synchronizing database, dropTablesBeforeSync = false');
    await connection.synchronize(false);

    logger.info('Generating basic users');
    await generateConstantUsers();

    logger.info('Seeding complete');
    await connection.close();
})();
