import * as typeorm from 'typeorm';

import GameApplicationFactory from '../app/factory/GameApplication.factory';
import GameScheduleFactory from '../app/factory/GameSchedule.factory';
import UserProfileFactory from '../app/factory/UserProfile.factory';
import UserStatsFactory from '../app/factory/UserStats.factory';
import GameFactory from '../app/factory/Game.factory';
import UserFactory from '../app/factory/User.factory';

import { Connection } from '../config/Database';
import { UserRole } from '../app/models/User';

import GameScheduleRepository from '../app/repository/GameSchedule.repository';
import UserGameStatsFactory from '../app/factory/UserGameStats.factory';
import UserRepository from '../app/repository/User.repository';
import ActivityFactory from '../app/factory/Activity.factory';

let connection: typeorm.Connection;
let connectionManager: typeorm.EntityManager;

const generateConstantUsers = async () => {
    for (const role of ['admin', 'moderator', 'user']) {
        const user = UserFactory.withUsername(`test-${role}`);
        user.role = (UserRole as any)[role.toUpperCase()];

        await connectionManager.transaction(async (transcation) => {
            await transcation.save(user);

            const profile = UserProfileFactory.default();
            const stats = UserStatsFactory.default();

            profile.user = user;
            stats.user = user;

            await transcation.save(profile);
            await transcation.save(stats);
        });
    }
};

const generateBasicUsers = async () => {
    await generateConstantUsers();

    for (let i = 4; i <= 100; i++) {
        await connectionManager.transaction(async (transaction) => {
            const profile = UserProfileFactory.default();
            const stats = UserStatsFactory.default();
            const user = UserFactory.default();

            await transaction.save(user);

            profile.user = user;
            stats.user = user;

            await transaction.save(profile);
            await transaction.save(stats);

            for (let j = 1; j <= 25; j++) {
                const activity = ActivityFactory.withUser(user);
                await transaction.save(activity);
            }
        });
    }
};

const generateGames = async () => {
    const userRepository = await typeorm.getCustomRepository(UserRepository);

    for (let i = 1; i <= 50; i++) {
        await connectionManager.transaction(async (transaction) => {
            const gameStats = UserGameStatsFactory.default();
            const schedule = GameScheduleFactory.default();
            schedule.game = await GameFactory.default();

            await transaction.save(schedule.game);
            await transaction.save(schedule);

            gameStats.user = await userRepository.findOne(i);
            await transaction.save(gameStats);
        });
    }
};

const generateApplications = async () => {
    const gameScheduleRepository = await typeorm.getCustomRepository(GameScheduleRepository);
    const userRepository = await typeorm.getCustomRepository(UserRepository);

    for (let i = 1; i <= 25; i++) {
        const schedule = await gameScheduleRepository.findOne(i);
        const user = await userRepository.findOne(i);

        const application = GameApplicationFactory.withScheduleAndUser(schedule, user);
        await connection.manager.save(application);
    }
};

(async () => {
    connection = await Connection;
    connectionManager = typeorm.getManager(connection.name);

    console.log('Seeding database');
    console.log('Synchronizing database, dropTablesBeforeSync = true');
    await connection.synchronize(true);

    console.log('Generating basic users');
    await generateBasicUsers();

    console.log('Generating games');
    await generateGames();

    console.log('Generating applications');
    await generateApplications();

    console.log('Seeding complete');
    await connection.close();
})();
