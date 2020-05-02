import { EntityManager, getCustomRepository, getManager, In } from 'typeorm';
import * as supertest from 'supertest';
import { random } from 'faker';
import * as chai from 'chai';
import * as _ from 'lodash';

import GameRepository from '../app/repository/Game.repository';
import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';

import { testSchemaValidation } from '../app/routes/validators';
import { addGamePlayerSchema, removeGamePlayerSchema } from '../app/routes/validators/game.validator';

import { GameSeeding, UserSeeding, GameScheduleSeeding } from '../app/seeding';
import { cookieForUser } from './helpers';

import { UserRole } from '../app/models/User';
import Game, { GameMode, GameStatus } from '../app/models/Game';
import { DATABASE_MAX_ID } from '../app/constants';
import UserRepository from '../app/repository/User.repository';
import UserGameStats from '../app/models/UserGameStats';
import UserGameStatsRepository from '../app/repository/userGameStats.repository';

const server: ServerService = new ServerService();
let agent: any;

// Used for the creation of the database transactions without the need of constantly calling into
// get manager every time a test needs a transaction.
const connectionManager: EntityManager = getManager();

describe('game', () => {
    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    afterEach(async () => {
        const gameRepository = getCustomRepository(GameRepository);
        await gameRepository.delete({});
    });

    describe('POST /games - Creating a new game', () => {
        it('Should not allow creation as a normal user', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            const game = await GameSeeding.default().save();

            await agent
                .post('/games')
                .set('Cookie', await cookieForUser(user))
                .send(game)
                .expect(403);
        });

        it('Should allow creating a game as a moderator or admin', async () => {
            for (const role of Object.values([UserRole.MODERATOR, UserRole.ADMIN])) {
                const user = await UserSeeding.withRole(role).save();

                const schedule = await new GameScheduleSeeding().withStatus(GameStatus.ACTIVE).save();
                let game = await GameSeeding.default().save();

                const response = await agent
                    .post('/games')
                    .set('Cookie', await cookieForUser(user))
                    .send({
                        schedule: schedule.id,
                        mode: game.mode,
                        title: game.title,
                        status: game.status,
                        storage: game.storage,
                        season: game.season,
                    })
                    .expect(201);

                const gameRepository = getCustomRepository(GameRepository);
                game = await gameRepository.findOne(response.body.id);

                chai.expect(response.body).to.include({
                    id: game.id,
                    mode: game.mode,
                    season: game.season,
                    status: game.status,
                });
            }
        });

        it('Should not allow creating the game if the schedule does not exist', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const game = await GameSeeding.default().save();

            await agent
                .post('/games')
                .set('Cookie', await cookieForUser(user))
                .send(Object.assign(game, { schedule: 99 }))
                .expect(404, { error: 'The given game schedule does not exist.' });
        });

        it('Should not allow creating the game if the schedule is not provided', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const game = await GameSeeding.default().save();

            await agent
                .post('/games')
                .set('Cookie', await cookieForUser(user))
                .send(game)
                .expect(400, { error: 'schedule is required, please check your content and try again.' });
        });

        it('Should not allow creating the game if the schedule is active', async () => {
            const schedule = await new GameScheduleSeeding().withStatus(GameStatus.SCHEDULED).save();
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const game = await GameSeeding.default().save();

            await agent
                .post('/games')
                .set('Cookie', await cookieForUser(user))
                .send(Object.assign(game, { schedule: schedule.id }))
                .expect(400, { error: 'The given game cannot be created if the schedule is not active.' });
        });

        it('Should contain the templates if the templates are apart of the request', async () => {
            const schedule = await new GameScheduleSeeding().withStatus(GameStatus.ACTIVE).save();
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const creatingGame = await GameSeeding.default().save();

            const templates = { html: 'html', css: 'css', js: 'js' };
            creatingGame.storage.templates = templates;

            const response = await agent
                .post('/games')
                .set('Cookie', await cookieForUser(user))
                .send(Object.assign(creatingGame, { schedule: schedule.id, templates }))
                .expect(201);

            const gameRepository = getCustomRepository(GameRepository);
            const game = await gameRepository.findOne(response.body.id);

            chai.expect(game.id).to.be.eq(response.body.id);
            chai.expect(game.storage.templates).to.be.deep.eq(templates);
            chai.expect(response.body.templates).to.be.deep.eq(templates);
        });
    });

    describe('GET - /games - Gathering All Games', () => {
        it('Should return all games in the system.', async () => {
            const game1 = await GameSeeding.default().save();
            const game2 = await GameSeeding.default().save();

            await connectionManager.transaction(async (transaction) => {
                await transaction.save(game1);
                await transaction.save(game2);
            });

            const response = await agent.get('/games').send().expect(200);

            chai.expect(response.body.length).to.be.equal(2);
        });
    });

    describe('GET - /games/latest - Gathering the latest games', () => {
        it('Should gather all the latest games', async () => {
            const game1 = await GameSeeding.default().save();
            const game2 = await GameSeeding.default().save();

            await connectionManager.transaction(async (transaction) => {
                await transaction.save(game2);
                await transaction.save(game1);
            });

            const response = await agent.get('/games/latest').send().expect(200);

            chai.expect(response.body.id).to.equal(game2.id);
        });
    });

    describe('GET - /games/:id - Gathering the specified game by id', () => {
        it('Should gathering a single game', async () => {
            const game1 = await GameSeeding.default().save();
            const game2 = await GameSeeding.default().save();
            const game3 = await GameSeeding.default().save();

            await connectionManager.transaction(async (transaction) => {
                await transaction.save(game1);
                await transaction.save(game2);
                await transaction.save(game3);
            });

            const response = await agent.get(`/games/${game2.id}`).expect(200);

            chai.expect(response.body.id).to.equal(game2.id);
        });

        it('should gather additional player details if specified', async () => {
            const game = await (await GameSeeding.default().common()).save();
            const playerIds = Object.keys(game.storage.players);
            const [player] = playerIds;

            // standard endpoint test (no specification).
            const standardResponse = await agent.get(`/games/${game.id}`).expect(200);
            chai.expect(standardResponse.body.id).to.equal(game.id);

            chai.expect(Object.keys(standardResponse.body.players)).to.deep.equal(playerIds);
            chai.expect(standardResponse.body.players[player]).to.deep.equal(game.storage.players[player]);

            // standard endpoint test with false specification
            const standardFalseResponse = await agent.get(`/games/${game.id}?players=false`).expect(200);
            chai.expect(standardFalseResponse.body.id).to.deep.equal(game.id);

            chai.expect(Object.keys(standardFalseResponse.body.players)).to.deep.equal(playerIds);
            chai.expect(standardFalseResponse.body.players[player]).to.deep.equal(game.storage.players[player]);

            // standard endpoint call specifying true for players.
            const playersResponse = await agent.get(`/games/${game.id}?players=true`).expect(200);
            chai.expect(playersResponse.body.id).to.deep.equal(game.id);

            chai.expect(Object.keys(playersResponse.body.players)).to.deep.equal(playerIds);
            chai.expect(playersResponse.body.players[player]).to.not.equal(game.storage.players[player]);

            const userRepository = getCustomRepository(UserRepository);
            const storedPlayer = await userRepository.findById(player);

            chai.expect(_.isNil(storedPlayer)).to.not.be.equal(true);

            // How the server would merge the given users when specifying to include players.
            const mergedPlayer = JSON.stringify(
                Object.assign(game.storage.players[player], {
                    avatarUrl: storedPlayer.avatarUrl,
                    username: storedPlayer.username,
                    id: storedPlayer.id,
                    connections: [],
                })
            );

            chai.expect(JSON.parse(mergedPlayer)).to.deep.equal(playersResponse.body.players[player]);
        });
    });

    describe('PATCH - /games/:id - Patching/Updating a game by id', () => {
        it('Should fail if the user is a standard user.', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            const game = await GameSeeding.default().save();

            await game.save();

            await agent
                .patch(`/games/${game.id}`)
                .set('Cookie', await cookieForUser(user))
                .send()
                .expect(403);
        });

        it('Should fail if the game does not exist.', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const game = await GameSeeding.default().save();
            await game.save();

            await agent
                .patch('/games/3')
                .set('Cookie', await cookieForUser(user))
                .send()
                .expect(404);
        });

        it('Should update if the user is a moderator.', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const game = await (await GameSeeding.default().withMode(GameMode.Blitz).common()).save();

            const response = await agent
                .patch(`/games/${game.id}`)
                .set('Cookie', await cookieForUser(user))
                .send({
                    mode: 'Classic',
                })
                .expect(200);

            chai.expect(response.body.mode).to.be.eq('Classic');
        });

        it('Should update if the user is a administrator.', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();
            const game = await (await GameSeeding.default().withMode(GameMode.Blitz).common()).save();

            const response = await agent
                .patch(`/games/${game.id}`)
                .set('Cookie', await cookieForUser(user))
                .send({
                    mode: 'Classic',
                })
                .expect(200);

            chai.expect(response.body.mode).to.be.eq('Classic');
        });
    });

    describe('POST - /:game/player - Adding a new player to the game', () => {
        const templatePlayerObject = { player: { id: 1, language: 'css', username: 'username', team: 1 } };
        let moderator: any = null;
        let game: any = null;

        beforeEach(async () => {
            moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();

            // remove the game players since tests are in relation to adding new players based on a
            // given id. Since the generation can create players that cause clashes and invalidates
            // the results.
            game = await GameSeeding.default().withMode(GameMode.Blitz).save();
            delete game.storage.players;
            await game.save();
        });

        it('Should not allow adding a player when not authenticated', async () => {
            await agent.post('/games/1/player').send().expect(401);
        });

        it('Should not allow adding a player when authenticated user is a standard user.', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();

            await agent
                .post('/games/1/player')
                .set('Cookie', await cookieForUser(user))
                .send()
                .expect(403);
        });

        it('Should allow adding a player when authenticated user is a moderator.', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();

            await agent
                .post(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(user))
                .send(templatePlayerObject)
                .expect(201);
        });

        it('Should allow adding a player when authenticated user is a administrator.', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();

            await agent
                .post(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(user))
                .send(templatePlayerObject)
                .expect(201);
        });

        it('Should fail if player object is not specified.', async () => {
            const player = _.cloneDeep(templatePlayerObject);
            delete player.player;

            await agent
                .post(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(400, { error: await testSchemaValidation(player, addGamePlayerSchema) });
        });

        it('Should fail if player id is not specified.', async () => {
            const player = _.cloneDeep(templatePlayerObject);
            delete player.player.id;

            await agent
                .post(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(400, { error: await testSchemaValidation(player, addGamePlayerSchema) });
        });

        it('Should fail if player username is not specified.', async () => {
            const player = _.cloneDeep(templatePlayerObject);
            delete player.player.username;

            await agent
                .post(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(400, { error: await testSchemaValidation(player, addGamePlayerSchema) });
        });

        it('Should fail if player language is not specified.', async () => {
            const player = _.cloneDeep(templatePlayerObject);
            delete player.player.language;

            await agent
                .post(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(400, { error: await testSchemaValidation(player, addGamePlayerSchema) });
        });

        it('Should fail if language is already assigned.', async () => {
            const player = _.cloneDeep(templatePlayerObject);

            await agent
                .post(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(201);

            await agent
                .post(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(409, { error: 'Player already assigned to that language.' });
        });

        it('Should fail if the player already assigned and tried changing teams.', async () => {
            const player = _.cloneDeep(templatePlayerObject);

            await agent
                .post(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(201);

            player.player.team = 2;

            await agent
                .post(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(409, { error: "Can't change player's team." });
        });
    });

    describe('DELETE - /:game/player - Removing players from a game team.', () => {
        const templatePlayerObject = { player: { id: 1 } };
        let moderator: any = null;
        let game: any = null;

        beforeEach(async () => {
            moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();
            game = await (await GameSeeding.default().withMode(GameMode.Blitz).common()).save();

            // work with a real existing player from the seeding.
            templatePlayerObject.player.id = game.storage.players[Object.keys(game.storage.players)[0]].id;
            await game.save();
        });

        it('Should not allow removing a user if a standard user.', async () => {
            await agent.delete('/games/1/player').send().expect(401);
        });

        it('Should allow removing a user if a moderator user.', async () => {
            await agent
                .delete(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(templatePlayerObject)
                .expect(201);
        });

        it('Should allow removing a user if a administrator user.', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();

            await agent
                .delete(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(user))
                .send(templatePlayerObject)
                .expect(201);
        });

        it('Should fail if the player object does not exist.', async () => {
            const player = _.cloneDeep(templatePlayerObject);
            delete player.player;

            await agent
                .delete(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(400, { error: await testSchemaValidation(player, removeGamePlayerSchema) });
        });

        it('Should fail if the game does not exist.', async () => {
            await agent
                .delete(`/games/${game.id}1/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(templatePlayerObject)
                .expect(404);
        });

        it('Should fail if the player id does not exist.', async () => {
            const player = _.cloneDeep(templatePlayerObject);
            delete player.player.id;

            await agent
                .delete(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(400, { error: await testSchemaValidation(player, removeGamePlayerSchema) });
        });

        it('Should respond 201 if the user does not exist by the id', async () => {
            await agent
                .delete(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(templatePlayerObject)
                .expect(201);
        });

        it('Should respond 201 if the user not exist by the id', async () => {
            const player = _.cloneDeep(templatePlayerObject);
            player.player.id = -1;

            await agent
                .delete(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(201);
        });
    });

    describe('GET - games/season/:season - Gathering a season by id', () => {
        it('Should reject if a given season id is not a number', async () => {
            for (const season of [null, undefined, 'test', {}]) {
                await agent.get(`/games/season/${season}`).expect(400, {
                    error: 'Invalid season id provided.',
                });
            }
        });

        it('Should reject if a given season id is larger than the database max or less than one', async () => {
            for (const season of [0, -10, DATABASE_MAX_ID + 1]) {
                await agent.get(`/games/season/${season}`).expect(400, {
                    error: 'Invalid season id provided.',
                });
            }
        });

        it('Should be able to gather a season by id if it exists', async () => {
            await connectionManager.transaction(async (transaction) => {
                const game1 = GameSeeding.default().withSeason(2).game;
                const game2 = GameSeeding.default().withSeason(2).game;
                const game3 = GameSeeding.default().withSeason(3).game;
                const game4 = GameSeeding.default().withSeason(1).game;

                await transaction.save(game1);
                await transaction.save(game2);
                await transaction.save(game3);
                await transaction.save(game4);
            });

            const season = random.arrayElement([
                { id: 1, amount: 1 },
                { id: 2, amount: 2 },
                { id: 3, amount: 1 },
            ]);

            const response = await agent.get(`/games/season/${season.id}`).send().expect(200);

            chai.expect(response.body.data.length).to.be.eq(season.amount);
            _.forEach(response.body.data, (game: Game) => chai.expect(game.season).to.be.eq(season.id));
        });

        it('Should filter the list if a status is specified', async () => {
            await connectionManager.transaction(async (transaction) => {
                const game1 = GameSeeding.default().withSeason(4).withStatus(GameStatus.ACTIVE).game;
                const game2 = GameSeeding.default().withSeason(4).withStatus(GameStatus.ENDED).game;
                const game3 = GameSeeding.default().withSeason(4).withStatus(GameStatus.SCHEDULED).game;

                await transaction.save(game1);
                await transaction.save(game2);
                await transaction.save(game3);
            });

            const gameRepository = getCustomRepository(GameRepository);
            const totalEnded = await gameRepository.count({ where: { status: GameStatus.ENDED } });

            const response = await agent.get('/games/season/4?status=ended').send().expect(200);

            chai.expect(response.body.data.length).to.be.eq(totalEnded);
            _.forEach(response.body.data, (game: Game) => chai.expect(game.season).to.be.eq(4));
            _.forEach(response.body.data, (game: Game) => chai.expect(game.status).to.be.eq(GameStatus.ENDED));
        });

        it('Should return the full list if the specified status filter is invalid', async () => {
            await connectionManager.transaction(async (transaction) => {
                const game1 = GameSeeding.default().withSeason(5).withStatus(GameStatus.ACTIVE).game;
                const game2 = GameSeeding.default().withSeason(5).withStatus(GameStatus.ENDED).game;
                const game3 = GameSeeding.default().withSeason(5).withStatus(GameStatus.SCHEDULED).game;

                await transaction.save(game1);
                await transaction.save(game2);
                await transaction.save(game3);
            });

            const gameRepository = getCustomRepository(GameRepository);
            const total = await gameRepository.count();

            const response = await agent.get('/games/season/5?status=cat').send().expect(200);

            chai.expect(response.body.data.length).to.be.eq(total);
            _.forEach(response.body.data, (game: Game) => chai.expect(game.season).to.be.eq(5));
        });
    });

    describe('POST - /:game/end - Ending a game', () => {
        it('Should fail to end the game if a standard user', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            const game = await GameSeeding.default().withStatus(GameStatus.ACTIVE).save();

            await agent
                .post(`/games/${game.id}/end`)
                .set('Cookie', await cookieForUser(user))
                .expect(403);
        });

        it('Should end the game if a the user is a moderator or administrator', async () => {
            for (const role of [UserRole.MODERATOR, UserRole.ADMIN]) {
                const user = await UserSeeding.withRole(role).save();
                const game = await GameSeeding.default().withStatus(GameStatus.ACTIVE).save();

                // remove users to ensure we are testing game ending state not
                // updating players game stats.
                game.storage.players = {};
                await game.save();

                await agent
                    .post(`/games/${game.id}/end`)
                    .set('Cookie', await cookieForUser(user))
                    .expect(200);
            }
        });

        it('Should fail to end the game if the game is already in end state', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();
            const game = await GameSeeding.default().withStatus(GameStatus.ENDED).save();

            await agent
                .post(`/games/${game.id}/end`)
                .set('Cookie', await cookieForUser(user))
                .expect(400, { error: 'The game is already in a end state.' });
        });

        it('Should increment the winners and loses wins/loses', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();
            let game = await (await GameSeeding.default().withStatus(GameStatus.ACTIVE).common()).save();

            // mark blue team as winners.
            game.storage.meta.teamScores[0].objectives = _.size(game.storage.teams[0].objectives);
            _.forEach(Object.keys(game.storage.teams[0].objectives), (key) => {
                game.storage.teams[0].objectives[key] = 'complete';
            });

            game.storage.meta.teamScores[1].objectives = 0;
            _.forEach(Object.keys(game.storage.teams[1].objectives), (key) => {
                game.storage.teams[1].objectives[key] = 'incomplete';
            });

            const userRepository = getCustomRepository(UserRepository);

            for (const player of Object.values(game.storage.players)) {
                const playerUser = await userRepository.findById(player.id);
                await new UserGameStats(playerUser).save();
            }

            await agent
                .post(`/games/${game.id}/end`)
                .set('Cookie', await cookieForUser(user))
                .expect(200);

            const gameRepository = getCustomRepository(GameRepository);
            game = await gameRepository.findOne({ where: { id: game.id } });

            const winner = game.storage.meta.winningTeam;

            const gameStatsRepository = getCustomRepository(UserGameStatsRepository);

            const winners = _.filter(game.storage.players, (player) => player.team === winner);
            const winnersId = _.map(winners, (e) => e.id);

            const losers = _.filter(game.storage.players, (player) => player.team !== winner);
            const losersId = _.map(losers, (e) => e.id);

            const gameStatsWinners = await gameStatsRepository.find({ where: { user: In(winnersId) } });
            chai.expect(_.size(gameStatsWinners)).to.be.equal(winnersId.length);

            for (const gameWinner of gameStatsWinners) {
                chai.expect(gameWinner.wins).to.be.equal(1, 'winners should have 1 won game.');
                chai.expect(gameWinner.loses).to.be.equal(0, 'winners should not have a single lost game.');
            }

            const gameStatsLosers = await gameStatsRepository.find({ where: { user: In(losersId) } });
            chai.expect(_.size(gameStatsLosers)).to.be.equal(losersId.length);

            for (const loser of gameStatsLosers) {
                chai.expect(loser.loses).to.be.equal(1, 'losers should have 1 lost game.');
                chai.expect(loser.wins).to.be.equal(0, 'losers should not have a single won game.');
            }
        });
    });
});
