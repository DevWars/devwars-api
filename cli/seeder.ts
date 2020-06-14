import * as typeorm from 'typeorm';

import GameApplicationSeeding from '../app/seeding/gameApplication.seeding';
import UserProfileSeeding from '../app/seeding/userProfile.seeding';
import UserStatsSeeding from '../app/seeding/userStats.seeding';
import ActivitySeeding from '../app/seeding/Activity.seeding';
import GameSeeding from '../app/seeding/game.seeding';
import UserSeeding from '../app/seeding/user.seeding';

import { Connection } from '../app/services/connection.service';
import User, { UserRole } from '../app/models/user.model';
import logger from '../app/utils/logger';

import UserRepository from '../app/repository/user.repository';
import EmailOptInSeeding from '../app/seeding/emailOptIn.seeding';
import { helpers } from 'faker';
import GameRepository from '../app/repository/game.repository';
import { UserGameStatsSeeding } from '../app/seeding';

let connection: typeorm.Connection;
let connectionManager: typeorm.EntityManager;

const players: User[] = [];

const generateConstantUsers = async (): Promise<any> => {
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

            players.push(user);
        });
    }
};

const generateBasicUsers = async (): Promise<any> => {
    await generateConstantUsers();

    for (let i = 4; i <= 100; i++) {
        await connectionManager.transaction(async (transaction) => {
            const profile = UserProfileSeeding.default();
            const emailOptIn = EmailOptInSeeding.default();
            const stats = UserStatsSeeding.default();
            const gameStats = UserGameStatsSeeding.default();
            const user = UserSeeding.default();

            await transaction.save(user);

            profile.user = user;
            stats.user = user;
            gameStats.user = user;
            emailOptIn.user = user;

            await transaction.save(profile);
            await transaction.save(stats);
            await transaction.save(gameStats);
            await transaction.save(emailOptIn);

            for (let j = 1; j <= 25; j++) {
                const activity = ActivitySeeding.withUser(user);
                await transaction.save(activity);
            }

            players.push(user);
        });
    }
};

const generateGames = async (): Promise<any> => {
    for (let i = 1; i <= 150; i++) {
        const gamePlayers = players.slice(i % players.length, (i + 6) % players.length);
        const game = (await GameSeeding.default().common(gamePlayers)).withSeason(helpers.randomize([1, 2, 3]));
        await game.save();
    }
};

const generateApplications = async (): Promise<any> => {
    const gameRepository = typeorm.getCustomRepository(GameRepository);
    const userRepository = typeorm.getCustomRepository(UserRepository);

    for (let i = 1; i <= 25; i++) {
        const game = await gameRepository.findOne(i);
        const user = await userRepository.findOne(i);

        const application = GameApplicationSeeding.withGameAndUser(game, user);
        await connection.manager.save(application);
    }
};

(async (): Promise<any> => {
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
