import * as typeorm from 'typeorm';

import GameApplicationSeeding from '../app/seeding/gameApplication.seeding';
import ActivitySeeding from '../app/seeding/activity.seeding';
import GameSeeding from '../app/seeding/game.seeding';
import UserSeeding from '../app/seeding/user.seeding';

import { Connection } from '../app/services/connection.service';
import User, { UserRole } from '../app/models/user.model';
import logger from '../app/utils/logger';

import UserRepository from '../app/repository/user.repository';
import { helpers } from 'faker';
import GameRepository from '../app/repository/game.repository';
import { GameStatus } from '../app/models/game.model';

let connection: typeorm.Connection;

const players: User[] = [];

const generateConstantUsers = async (): Promise<any> => {
    for (const role of ['admin', 'moderator', 'user']) {
        await UserSeeding.withComponents(`test-${role}`, null, (UserRole as any)[role.toUpperCase()]).save();
    }
};

const generateBasicUsers = async (): Promise<any> => {
    await generateConstantUsers();

    for (let i = 4; i <= 100; i++) {
        const user = await UserSeeding.withComponents().save();

        for (let j = 1; j <= 25; j++) {
            const activity = ActivitySeeding.withUser(user);
            await activity.save();
        }

        players.push(user);
    }
};

const generateGames = async (): Promise<any> => {
    for (let i = 1; i <= 150; i++) {
        const gamePlayers = players.slice(i % players.length, (i + 6) % players.length);
        const game = (await GameSeeding.default().common(gamePlayers))
            .withStatus(GameStatus.ENDED)
            .withSeason(helpers.randomize([1, 2, 3]));
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
