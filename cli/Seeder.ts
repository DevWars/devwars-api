import * as typeorm from 'typeorm';

import { Connection } from '../config/Database';

import UserFactory from '../app/factory/User.factory';
import UserProfileFactory from '../app/factory/UserProfile.factory';
import GameFactory from '../app/factory/Game.factory';
import GameScheduleFactory from '../app/factory/GameSchedule.factory';
import GameApplicationFactory from '../app/factory/GameApplication.factory';

import UserStatsFactory from '../app/factory/UserStats.factory';

import User from '../app/models/User';
import { UserRole } from '../app/models/User';

import UserRepository from '../app/repository/User.repository';
import GameScheduleRepository from '../app/repository/GameSchedule.repository';
import UserGameStatsFactory from '../app/factory/UserGameStats.factory';
import ActivityFactory from '../app/factory/Activity.factory';

let connection: typeorm.Connection;

const generateConstantUsers = async () => {
    for (const role of ['admin', 'moderator', 'user']) {
        const user = UserFactory.withUsername(`test-${role}`);
        user.role = (UserRole as any)[role.toUpperCase()];
        const newUser = await user.save();

        const profile = UserProfileFactory.default();
        profile.user = newUser;
        await connection.manager.save(profile);

        const stats = UserStatsFactory.default();
        stats.user = newUser;
        await connection.manager.save(stats);
    }
};

const generateBasicUsers = async () => {
    await generateConstantUsers();

    for (let i = 4; i < 100; i++) {
        const user = UserFactory.default();
        const newUser = await connection.manager.save(user);

        const profile = UserProfileFactory.default();
        profile.user = newUser;
        await connection.manager.save(profile);

        const stats = UserStatsFactory.default();
        stats.user = newUser;
        await connection.manager.save(stats);

        await generateActivitiesForUser(user);
    }
};

const generateActivitiesForUser = async (user: User) => {
    for (let i = 1; i < 25; i++) {
        const activity = ActivityFactory.withUser(user);

        await connection.manager.save(activity);
    }
};

const generateGames = async () => {
    for (let i = 1; i < 50; i++) {
        const schedule = GameScheduleFactory.default();
        const newSchedule = await connection.manager.save(schedule);

        const game = GameFactory.default();
        newSchedule.game = await connection.manager.save(game);
        await connection.manager.save(newSchedule);

        const userRepository = await typeorm.getCustomRepository(UserRepository);
        const gameStats = UserGameStatsFactory.default();
        gameStats.user = await userRepository.findOne(i);
        await connection.manager.save(gameStats);
    }
};

const generateApplications = async () => {
    for (let i = 1; i < 25; i++) {
        const userRepository = await typeorm.getCustomRepository(UserRepository);
        const user = await userRepository.findOne(i);

        const gameScheduleRepository = await typeorm.getCustomRepository(GameScheduleRepository);
        const schedule = await gameScheduleRepository.findOne(user.id);

        const application = GameApplicationFactory.withScheduleAndUser(schedule, user);
        await connection.manager.save(application);
    }
};

(async () => {
    connection = await Connection;

    await connection.synchronize(true);

    await generateBasicUsers();

    await generateGames();
    await generateApplications();

    const userRepository = await typeorm.getCustomRepository(UserRepository);
    const user = await userRepository.findOne(5);
    user.profile = await userRepository.findProfileByUser(user);

    await connection.close();
})();
