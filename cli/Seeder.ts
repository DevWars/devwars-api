import * as typeorm from 'typeorm';

import GameApplicationSeeding from '../app/seeding/GameApplication.seeding';
import GameScheduleSeeding from '../app/seeding/GameSchedule.seeding';
import UserProfileSeeding from '../app/seeding/UserProfile.seeding';
import UserStatsSeeding from '../app/seeding/UserStats.seeding';
import GameSeeding from '../app/seeding/Game.seeding';
import UserSeeding from '../app/seeding/User.seeding';

import { Connection } from '../app/services/connection.service';
import { UserRole } from '../app/models/User';

import GameScheduleRepository from '../app/repository/GameSchedule.repository';
import UserGameStatsSeeding from '../app/seeding/UserGameStats.seeding';
import UserRepository from '../app/repository/User.repository';
import ActivitySeeding from '../app/seeding/Activity.seeding';

let connection: typeorm.Connection;
let connectionManager: typeorm.EntityManager;

const generateConstantUsers = async () => {
    for (const role of ['admin', 'moderator', 'user']) {
        const user = UserSeeding.withUsername(`test-${role}`);
        user.role = (UserRole as any)[role.toUpperCase()];

        await connectionManager.transaction(async (transaction) => {
            await transaction.save(user);

            const profile = UserProfileSeeding.default();
            const stats = UserStatsSeeding.default();

            profile.user = user;
            stats.user = user;

            await transaction.save(profile);
            await transaction.save(stats);
        });
    }
};

const generateBasicUsers = async () => {
    await generateConstantUsers();

    for (let i = 4; i <= 100; i++) {
        await connectionManager.transaction(async (transaction) => {
            const profile = UserProfileSeeding.default();
            const stats = UserStatsSeeding.default();
            const user = UserSeeding.default();

            await transaction.save(user);

            profile.user = user;
            stats.user = user;

            await transaction.save(profile);
            await transaction.save(stats);

            for (let j = 1; j <= 25; j++) {
                const activity = ActivitySeeding.withUser(user);
                await transaction.save(activity);
            }
        });
    }
};

const generateGames = async () => {
    const userRepository = typeorm.getCustomRepository(UserRepository);

    for (let i = 1; i <= 50; i++) {
        await connectionManager.transaction(async (transaction) => {
            const gameStats = UserGameStatsSeeding.default();
            const schedule = GameScheduleSeeding.default();
            schedule.game = await GameSeeding.default();

            await transaction.save(schedule.game);
            await transaction.save(schedule);

            gameStats.user = await userRepository.findOne(i);
            await transaction.save(gameStats);
        });
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
