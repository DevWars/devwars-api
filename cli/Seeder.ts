import * as typeorm from 'typeorm';

import GameApplicationSeeding from '../app/seeding/GameApplication.seeding';
import UserGameStatsSeeding from '../app/seeding/UserGameStats.seeding';
import GameScheduleSeeding from '../app/seeding/GameSchedule.seeding';
import UserProfileSeeding from '../app/seeding/UserProfile.seeding';
import UserStatsSeeding from '../app/seeding/UserStats.seeding';
import ActivitySeeding from '../app/seeding/Activity.seeding';
import GameSeeding from '../app/seeding/Game.seeding';
import UserSeeding from '../app/seeding/User.seeding';

import { Connection } from '../app/services/Connection.service';
import { UserRole } from '../app/models/User';
import logger from '../app/utils/logger';

import GameScheduleRepository from '../app/repository/GameSchedule.repository';
import UserRepository from '../app/repository/User.repository';
import EmailOptInSeeding from '../app/seeding/EmailOptIn.seeding';
import { helpers } from 'faker';

let connection: typeorm.Connection;
let connectionManager: typeorm.EntityManager;

const generateConstantUsers = async () => {
    for (const role of ['admin', 'moderator', 'user']) {
        const user = UserSeeding.withUsername(`test-${role}`);
        user.role = (UserRole as any)[role.toUpperCase()];

        await connectionManager.transaction(async (transaction) => {
            await transaction.save(user);

            const profile = UserProfileSeeding.default();
            const emailOptIn = EmailOptInSeeding.default();
            const stats = UserStatsSeeding.default();

            profile.user = user;
            stats.user = user;
            emailOptIn.user = user;

            await transaction.save(profile);
            await transaction.save(stats);
            await transaction.save(emailOptIn);
        });
    }
};

const generateBasicUsers = async () => {
    await generateConstantUsers();

    for (let i = 4; i <= 100; i++) {
        await connectionManager.transaction(async (transaction) => {
            const profile = UserProfileSeeding.default();
            const emailOptIn = EmailOptInSeeding.default();
            const stats = UserStatsSeeding.default();
            const user = UserSeeding.default();

            await transaction.save(user);

            profile.user = user;
            stats.user = user;
            emailOptIn.user = user;

            await transaction.save(profile);
            await transaction.save(stats);
            await transaction.save(emailOptIn);

            for (let j = 1; j <= 25; j++) {
                const activity = ActivitySeeding.withUser(user);
                await transaction.save(activity);
            }
        });
    }
};

const generateGames = async () => {
    for (let i = 1; i <= 50; i++) {
        const game = (await GameSeeding.default(true).common()).withSeason(helpers.randomize([1, 2, 3]));
        await game.save();
    }
};

const generateApplications = async () => {
    const gameScheduleRepository = typeorm.getCustomRepository(GameScheduleRepository);
    const userRepository = typeorm.getCustomRepository(UserRepository);

    for (let i = 1; i <= 25; i++) {
        const schedule = await gameScheduleRepository.findOne(i);
        const user = await userRepository.findOne(i);

        const application = GameApplicationSeeding.withScheduleAndUser(schedule, user);
        await connection.manager.save(application);
    }
};

(async () => {
    connection = await Connection;
    connectionManager = typeorm.getManager(connection.name);

    logger.info('Seeding database');
    logger.info('Synchronizing database, dropTablesBeforeSync = true');
    await connection.synchronize(true);

    logger.info('Generating basic users');
    await generateBasicUsers();

    logger.info('Generating games');
    await generateGames();

    logger.info('Generating applications');
    await generateApplications();

    // logger.info('Seeding complete');
    await connection.close();
})();
