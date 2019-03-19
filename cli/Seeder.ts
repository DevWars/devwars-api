import * as typeorm from 'typeorm';

import { Connection } from '../config/Database';

import {
    CompetitorFactory,
    GameFactory,
    GameTeamFactory,
    ObjectiveFactory,
    PlayerFactory,
    UserFactory,
} from '../app/factory';
import { GameApplicationFactory } from '../app/factory/GameApplication.factory';
import { UserProfileFactory } from '../app/factory/UserProfile.factory';
import { UserStatsFactory } from '../app/factory/UserStats.factory';
import { Game, User, UserProfile, UserRole } from '../app/models';
import { UserRepository } from '../app/repository';
import GameService from '../app/services/Game.service';

let connection: typeorm.Connection;

const generateConstantUsers = async () => {
    for (const role of ['admin', 'moderator', 'user']) {
        const user = UserFactory.withUsername(`test-${role}`);
        user.role = (UserRole as any)[role.toUpperCase()];

        await user.save();
    }

    const competitiveUser = UserFactory.withUsername('test-competitor');
    competitiveUser.role = UserRole.USER;

    const competitor = CompetitorFactory.withUser(competitiveUser);

    await competitiveUser.save();
    await competitor.save();
};

const generateBasicUsers = async () => {
    await generateConstantUsers();

    for (let i = 0; i < 100; i++) {
        const user = UserFactory.default();
        const newUser = await connection.manager.save(user);

        const profile = UserProfileFactory.default();
        profile.user = newUser;
        await connection.manager.save(profile);

        const stats = UserStatsFactory.default();
        stats.user = newUser;
        await connection.manager.save(stats);
    }
};

const generateUpcomingGames = async () => {
    for (let i = 0; i < 50; i++) {
        let game: Game;

        await connection.manager.transaction(async (em) => {
            game = await em.save(GameFactory.upcoming());

            const objectives = ObjectiveFactory.defaultObjectivesForGame(game);

            await em.save(objectives);

            const teams = GameTeamFactory.defaultTeamsForGame(game);

            for (const team of teams) {
                team.completedObjectives.push(...objectives.slice(0, Math.random() * objectives.length));

                await em.save(team);

                const players = PlayerFactory.defaultPlayersForTeam(team);

                for (const player of players) {
                    const user = await em.save(UserFactory.default());
                    const competitor = CompetitorFactory.default();
                    const application = GameApplicationFactory.withGameAndUser(game, user);

                    competitor.user = user;
                    player.user = user;

                    await em.save(competitor);
                    await em.save(player);
                    await em.save(application);
                }
            }
        });
    }
};

const generateFinishedGames = async () => {
    for (let i = 0; i < 50; i++) {
        let game: Game;

        await connection.manager.transaction(async (em) => {
            game = await em.save(GameFactory.default());

            const objectives = ObjectiveFactory.defaultObjectivesForGame(game);

            await em.save(objectives);

            const teams = GameTeamFactory.defaultTeamsForGame(game);

            for (const team of teams) {
                team.completedObjectives.push(...objectives.slice(0, Math.random() * objectives.length));

                await em.save(team);

                const players = PlayerFactory.defaultPlayersForTeam(team);

                for (const player of players) {
                    const user = await em.save(UserFactory.default());
                    const competitor = CompetitorFactory.default();
                    const application = GameApplicationFactory.withGameAndUser(game, user);

                    competitor.user = user;
                    player.user = user;

                    await em.save(competitor);
                    await em.save(player);
                    await em.save(application);
                }
            }
        });
    }

    const allGames = await Game.find({ relations: ['teams'] });

    for (const game of allGames) {
        const winner = game.teams[Math.floor(Math.random() * game.teams.length)];

        await GameService.endGame(game, winner);
    }
};

(async () => {
    connection = await Connection;

    await connection.synchronize(true);

    await generateBasicUsers();

    // await generateFinishedGames();

    // await generateUpcomingGames();

    const userRepository = await typeorm.getCustomRepository(UserRepository);
    const user = await userRepository.findOne(5);
    user.profile = await userRepository.findProfileByUser(user);

    console.log(user);

    await connection.close();
})();
