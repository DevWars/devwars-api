import * as supertest from 'supertest';

import ServerService from '../app/services/server.service';
import { UserRole } from '../app/models/user.model';
import { UserSeeding, GameSeeding } from '../app/seeding';
import { cookieForUser } from './helpers';
import { GameStatus } from '../app/models/game.model';

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
        it.skip('Should fail if not authenticated');
        it.skip('Should fail if not the bot or a moderator');
        it.skip('Should fail if the game does not exist');
        it.skip('Should fail if the game is already activated');
        it.skip('Should pass and update the game status if in correct state');
    });

    describe('POST - /:game/actions/end - Ending a game', () => {
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
                    .expect(200);
            }
        });

        it('Should fail to end the game if the game is already in end state', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();
            const game = await GameSeeding.default().withStatus(GameStatus.ENDED).save();

            await agent
                .post(`/games/${game.id}/actions/end`)
                .set('Cookie', await cookieForUser(user))
                .expect(400, { error: 'The game is already in a end state.' });
        });

        it.skip('Should increment the winners and loses wins/loses', async () => {
            // const user = await UserSeeding.withRole(UserRole.ADMIN).save();
            // let game = await (await GameSeeding.default().withStatus(GameStatus.ACTIVE).common()).save();
            // // mark blue team as winners.
            // game.storage.meta.teamScores[0].objectives = _.size(game.storage.teams[0].objectives);
            // _.forEach(Object.keys(game.storage.teams[0].objectives), (key) => {
            //     game.storage.teams[0].objectives[key] = 'complete';
            // });
            // game.storage.meta.teamScores[1].objectives = 0;
            // _.forEach(Object.keys(game.storage.teams[1].objectives), (key) => {
            //     game.storage.teams[1].objectives[key] = 'incomplete';
            // });
            // const userRepository = getCustomRepository(UserRepository);
            // for (const player of Object.values(game.storage.players)) {
            //     const playerUser = await userRepository.findById(player.id);
            //     await new UserGameStats(playerUser).save();
            // }
            // await agent
            //     .post(`/games/${game.id}/end`)
            //     .set('Cookie', await cookieForUser(user))
            //     .expect(200);
            // const gameRepository = getCustomRepository(GameRepository);
            // game = await gameRepository.findOne({ where: { id: game.id } });
            // const winner = game.storage.meta.winningTeam;
            // const gameStatsRepository = getCustomRepository(UserGameStatsRepository);
            // const winners = _.filter(game.storage.players, (player) => player.team === winner);
            // const winnersId = _.map(winners, (e) => e.id);
            // const losers = _.filter(game.storage.players, (player) => player.team !== winner);
            // const losersId = _.map(losers, (e) => e.id);
            // const gameStatsWinners = await gameStatsRepository.find({ where: { user: In(winnersId) } });
            // chai.expect(_.size(gameStatsWinners)).to.be.equal(winnersId.length);
            // for (const gameWinner of gameStatsWinners) {
            //     chai.expect(gameWinner.wins).to.be.equal(1, 'winners should have 1 won game.');
            //     chai.expect(gameWinner.loses).to.be.equal(0, 'winners should not have a single lost game.');
            // }
            // const gameStatsLosers = await gameStatsRepository.find({ where: { user: In(losersId) } });
            // chai.expect(_.size(gameStatsLosers)).to.be.equal(losersId.length);
            // for (const loser of gameStatsLosers) {
            //     chai.expect(loser.loses).to.be.equal(1, 'losers should have 1 lost game.');
            //     chai.expect(loser.wins).to.be.equal(0, 'losers should not have a single won game.');
            // }
        });
    });
});
