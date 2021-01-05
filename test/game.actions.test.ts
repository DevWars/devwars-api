import { getCustomRepository } from 'typeorm';
import * as supertest from 'supertest';
import * as chai from 'chai';

import GameApplicationRepository from '../app/repository/gameApplication.repository';
import GameRepository from '../app/repository/game.repository';

import { GameStatus } from '../app/models/game.model';
import { UserRole } from '../app/models/user.model';

import ServerService from '../app/services/server.service';
import { UserSeeding, GameSeeding } from '../app/seeding';
import { cookieForUser } from './helpers';
import { EndGameRequest } from '../app/request/endGameRequest';

const server: ServerService = new ServerService();
let agent: supertest.SuperTest<supertest.Test> = null;

describe('Game Actions', () => {
    before(async () => {
        await server.Start();
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('POST - /:game/actions/activate - Activate a game', () => {
        it('Should fail if not authenticated', async () => {
            const response = await agent.post('/games/1/actions/activate');
            chai.expect(response.status).to.be.equal(401);
        });

        it('Should fail if not the bot or a moderator', async () => {
            for (const test of [
                { role: UserRole.USER, code: 403 },
                { role: UserRole.MODERATOR, code: 200 },
                { role: UserRole.ADMIN, code: 200 },
            ]) {
                const user = await UserSeeding.withRole(test.role).save();
                const game = await GameSeeding.default().withStatus(GameStatus.SCHEDULED).save();

                const response = await agent
                    .post(`/games/${game.id}/actions/activate`)
                    .set('Cookie', await cookieForUser(user))
                    .send();

                chai.expect(response.status).to.be.equal(test.code);
            }
        });

        it('Should fail if the game does not exist', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();

            const response = await agent
                .post('/games/999/actions/activate')
                .set('Cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(404);
            chai.expect(response.body.error).to.be.equal('A game does not exist by the provided game id.');
        });

        it('Should fail if the game is already activated', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const game = await GameSeeding.default().withStatus(GameStatus.ACTIVE).save();

            const response = await agent
                .post(`/games/${game.id}/actions/activate`)
                .set('Cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(409);
            chai.expect(response.body.error).to.be.equal('The specified game is already activated.');
        });

        it('Should allow activation of a ended game to active again', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const game = await GameSeeding.default().withStatus(GameStatus.ENDED).save();

            const response = await agent
                .post(`/games/${game.id}/actions/activate`)
                .set('Cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);

            const gameRepository = getCustomRepository(GameRepository);
            const updatedGame = await gameRepository.findOne({ where: { id: game.id }, select: ['status'] });

            chai.expect(updatedGame.status).to.be.equal(GameStatus.ACTIVE);
        });

        it('Should pass and update the game status if in correct state', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const game = await GameSeeding.default().withStatus(GameStatus.SCHEDULED).save();

            const response = await agent
                .post(`/games/${game.id}/actions/activate`)
                .set('Cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);

            const gameRepository = getCustomRepository(GameRepository);
            const updatedGame = await gameRepository.findOne({ where: { id: game.id }, select: ['status'] });

            chai.expect(updatedGame.status).to.be.equal(GameStatus.ACTIVE);
        });
    });

    describe('POST - /:game/actions/end - Ending a game', () => {
        it('Should allow being ended if the requesting user is the bot', async () => {
            const game = await GameSeeding.default().withStatus(GameStatus.ACTIVE).save();

            await agent
                .post(`/games/${game.id}/actions/end`)
                .send({
                    apiKey: process.env.API_KEY,
                    id: game.id,
                    mode: game.mode,
                    title: game.title,
                    stage: 'end',
                    objectives: [],
                    teams: [],
                    editors: [],
                    players: [],
                    teamVoteResults: [],
                })
                .expect(200);
        });

        it('Should fail to end the game if a standard user', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            const game = await GameSeeding.default().withStatus(GameStatus.ACTIVE).save();

            await agent
                .post(`/games/${game.id}/actions/end`)
                .set('Cookie', await cookieForUser(user))
                .expect(403);
        });

        it('Should end the game if a the user is a moderator or administrator', async () => {
            for (const role of [UserRole.MODERATOR, UserRole.ADMIN]) {
                const user = await UserSeeding.withRole(role).save();
                const game = await GameSeeding.default().withStatus(GameStatus.ACTIVE).save();

                // remove users to ensure we are testing game ending state not
                // updating players game stats.
                await game.save();

                await agent
                    .post(`/games/${game.id}/actions/end`)
                    .set('Cookie', await cookieForUser(user))
                    .send({
                        id: game.id,
                        mode: game.mode,
                        title: game.title,
                        stage: 'end',
                        objectives: [],
                        teams: [],
                        editors: [],
                        players: [],
                        teamVoteResults: [],
                    })
                    .expect(200);
            }
        });

        it('Should fail to end the game if the game is already in end state', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();
            const game = await GameSeeding.default().withStatus(GameStatus.ENDED).save();

            await agent
                .post(`/games/${game.id}/actions/end`)
                .set('Cookie', await cookieForUser(user))
                .send({
                    id: game.id,
                    mode: game.mode,
                    title: game.title,
                    stage: 'end',
                    objectives: [],
                    teams: [],
                    editors: [],
                    players: [],
                    teamVoteResults: [],
                })
                .expect(400, { error: 'The game is already in a end state.' });
        });

        /*
        it('should increase the winstreak if the given users win', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();

            const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
            const gameRepository = getCustomRepository(GameRepository);

            const gameSetup = await GameSeeding.default().withStatus(GameStatus.ACTIVE).common();
            let game = await gameSetup.save();

            const allUsers = await gameApplicationRepository.findAssignedPlayersForGame(game, [
                'user',
                'user.gameStats',
            ]);

            for (const player of allUsers) {
                player.user.gameStats.winStreak = 0;
                await player.user.gameStats.save();
            }

            await agent
                .post(`/games/${game.id}/actions/end`)
                .set('Cookie', await cookieForUser(user))
                .send({
                    id: game.id,
                    mode: game.mode,
                    title: game.title,
                    stage: 'end',
                    objectives: [],
                    teams: [],
                    editors: [],
                    players: [],
                    teamVoteResults: [],
                })
                .expect(200);

            game = await gameRepository.findOne(game.id);
            const winner = game.storage.meta.winningTeam;

            const winners = await gameApplicationRepository.getAssignedPlayersForTeam(game, winner, [
                'user',
                'user.gameStats',
            ]);

            for (const gameWinner of winners) {
                const { gameStats } = gameWinner.user;

                chai.expect(gameStats.winStreak).to.be.equal(1, 'winnners streak should now be one.');
            }
        });

        it('should reset the winstreak if the given users win', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();

            const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
            const gameRepository = getCustomRepository(GameRepository);

            const gameSetup = await GameSeeding.default().withStatus(GameStatus.ACTIVE).common();
            let game = await gameSetup.save();

            const allUsers = await gameApplicationRepository.findAssignedPlayersForGame(game, [
                'user',
                'user.gameStats',
            ]);

            for (const { user } of allUsers) {
                user.gameStats.winStreak = 5;
                user.gameStats.loses = 0;
                user.gameStats.wins = 5;

                await user.gameStats.save();
            }

            await agent
                .post(`/games/${game.id}/actions/end`)
                .set('Cookie', await cookieForUser(user))
                .send({
                    id: game.id,
                    mode: game.mode,
                    title: game.title,
                    stage: 'end',
                    objectives: [],
                    teams: [],
                    editors: [],
                    players: [],
                    teamVoteResults: [],
                })
                .expect(200);

            game = await gameRepository.findOne(game.id);
            const loser = game.storage.meta.winningTeam === 1 ? 0 : 1;

            const losers = await gameApplicationRepository.getAssignedPlayersForTeam(game, loser, [
                'user',
                'user.gameStats',
            ]);

            for (const loser of losers) {
                const { gameStats } = loser.user;

                chai.expect(gameStats.winStreak).to.be.equal(0, 'losers win streak should be reset to 0.');
            }
        });

        it('Should increment the winners and loses wins/loses', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();

            const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
            const gameRepository = getCustomRepository(GameRepository);

            const gameSetup = await GameSeeding.default().withStatus(GameStatus.ACTIVE).common();
            let game = await gameSetup.save();

            const allUsers = await gameApplicationRepository.findAssignedPlayersForGame(game, [
                'user',
                'user.gameStats',
            ]);

            for (const player of allUsers) {
                player.user.gameStats.wins = 0;
                player.user.gameStats.loses = 0;

                await player.user.gameStats.save();
            }

            await agent
                .post(`/games/${game.id}/actions/end`)
                .set('Cookie', await cookieForUser(user))
                .send({
                    id: game.id,
                    mode: game.mode,
                    title: game.title,
                    stage: 'end',
                    objectives: [],
                    teams: [],
                    editors: [],
                    players: [],
                    teamVoteResults: [],
                })
                .expect(200);

            game = await gameRepository.findOne(game.id);
            const winner = game.storage.meta.winningTeam;
            const loser = game.storage.meta.winningTeam === 1 ? 0 : 1;

            const winners = await gameApplicationRepository.getAssignedPlayersForTeam(game, winner, [
                'user',
                'user.gameStats',
            ]);

            const losers = await gameApplicationRepository.getAssignedPlayersForTeam(game, loser, [
                'user',
                'user.gameStats',
            ]);

            for (const gameWinner of winners) {
                const { gameStats } = gameWinner.user;

                chai.expect(gameStats.wins).to.be.equal(1, 'winners should have 1 won game.');
                chai.expect(gameStats.loses).to.be.equal(0, 'winners should not have a single lost game.');
            }

            for (const loser of losers) {
                const { gameStats } = loser.user;

                chai.expect(gameStats.loses).to.be.equal(1, 'losers should have 1 lost game.');
                chai.expect(gameStats.wins).to.be.equal(0, 'losers should not have a single won game.');
            }
        });

        it.only('Should increase and decrease winners/losers experience', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();

            const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
            const gameRepository = getCustomRepository(GameRepository);

            const gameSetup = await GameSeeding.default().withStatus(GameStatus.ACTIVE).common();
            let game = await gameSetup.save();

            const allUsers = await gameApplicationRepository.findAssignedPlayersForGame(game, ['user', 'user.stats']);

            for (const player of allUsers) {
                player.user.stats.xp = 1000;
                await player.user.stats.save();
            }

            await agent
                .post(`/games/${game.id}/actions/end`)
                .set('Cookie', await cookieForUser(user))
                .send({
                    id: game.id,
                    mode: game.mode,
                    title: game.title,
                    stage: 'end',
                    objectives: [],
                    teams: [{
                        id: 1,
                        name: 'team-1',
                        completeObjectives: [],
                        objectiveScore: 0,
                        enabled: false,
                    }, {
                        id: 2,
                        name: 'team-2',
                        completeObjectives: [],
                        objectiveScore: 0,
                        enabled: false,
                    }],
                    editors: [],
                    players: [],
                    teamVoteResults: [{
                        category: 'design',
                        score: 0,
                        teamId: 0,
                        total: 0,
                        votes: 0,
                    }, {
                        category: 'design',
                        score: 0,
                        teamId: 1,
                        total: 0,
                        votes: 0,
                    }, {
                        category: 'function',
                        score: 0,
                        teamId: 0,
                        total: 0,
                        votes: 0,
                    }, {
                        category: 'function',
                        score: 0,
                        teamId: 1,
                        total: 0,
                        votes: 0,
                    }],
                } as EndGameRequest)
                .expect(200);

            game = await gameRepository.findOne(game.id);
            const winner = game.storage.meta.winningTeam;
            const loser = game.storage.meta.winningTeam === 1 ? 0 : 1;

            const winners = await gameApplicationRepository.getAssignedPlayersForTeam(game, winner, [
                'user',
                'user.stats',
            ]);

            const losers = await gameApplicationRepository.getAssignedPlayersForTeam(game, loser, [
                'user',
                'user.stats',
            ]);

            for (const gameWinner of winners) {
                const { stats } = gameWinner.user;

                chai.expect(stats.xp).to.be.greaterThan(1000, 'winners should gain experience.');
            }

            for (const loser of losers) {
                const { stats } = loser.user;
                chai.expect(stats.xp).to.be.lessThan(1000, 'losers should lose experience.');
            }
        });
        */
    });
});
