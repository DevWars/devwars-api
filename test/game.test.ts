import { getManager, EntityManager, getCustomRepository } from 'typeorm';
import * as supertest from 'supertest';
import { random } from 'faker';
import * as chai from 'chai';
import * as _ from 'lodash';

import GameRepository from '../app/repository/Game.repository';
import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';

import { testSchemaValidation } from '../app/routes/validators';
import { addGamePlayerSchema, removeGamePlayerSchema } from '../app/routes/validators/game.validator';

import { GameSeeding, UserSeeding } from '../app/seeding';
import { cookieForUser } from './helpers';

import { UserRole } from '../app/models/User';
import Game from '../app/models/Game';
import { DATABASE_MAX_ID } from '../app/constants';

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
            const game = await GameSeeding.default();

            await agent
                .post('/games')
                .set('Cookie', await cookieForUser(user))
                .send(game)
                .expect(403);
        });

        it('Should allow creating a game as a moderator', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const game = await GameSeeding.default();

            const response = await agent
                .post('/games')
                .set('Cookie', await cookieForUser(user))
                .send(game)
                .expect(201);

            chai.expect(response.body.mode).to.be.eq(game.mode);
        });

        it('Should allow creating a game as a administrator', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();
            const game = await GameSeeding.default();

            const response = await agent
                .post('/games')
                .set('Cookie', await cookieForUser(user))
                .send(game);

            chai.expect(response.status).to.be.eq(201);
            chai.expect(response.body.mode).to.be.eq(game.mode);
        });
    });

    describe('GET /games - Gathering All Games', () => {
        it('Should return all games in the system.', async () => {
            const game1 = await GameSeeding.default();
            const game2 = await GameSeeding.default();

            await connectionManager.transaction(async (transaction) => {
                await transaction.save(game1);
                await transaction.save(game2);
            });

            const response = await agent
                .get('/games')
                .send()
                .expect(200);

            chai.expect(response.body.length).to.be.equal(2);
        });
    });

    describe('GET /games/latest - Gathering the latest games', () => {
        it('Should gather all the latest games', async () => {
            const game1 = await GameSeeding.default();
            const game2 = await GameSeeding.default();

            await connectionManager.transaction(async (transaction) => {
                await transaction.save(game2);
                await transaction.save(game1);
            });

            const response = await agent
                .get('/games/latest')
                .send()
                .expect(200);

            chai.expect(response.body.id).to.equal(game2.id);
        });
    });

    describe('GET /games/:id - Gathering the specified game by id', () => {
        it('Should gathering a single game', async () => {
            const game1 = await GameSeeding.default();
            const game2 = await GameSeeding.default();
            const game3 = await GameSeeding.default();

            await connectionManager.transaction(async (transaction) => {
                await transaction.save(game1);
                await transaction.save(game2);
                await transaction.save(game3);
            });

            const response = await agent
                .get(`/games/${game2.id}`)
                .send()
                .expect(200);

            chai.expect(response.body.id).to.equal(game2.id);
        });
    });

    describe('PATCH - /games/:id - Patching/Updating a game by id', () => {
        it('Should fail if the user is a standard user.', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            const game = await GameSeeding.default();

            await game.save();

            await agent
                .patch(`/games/${game.id}`)
                .set('Cookie', await cookieForUser(user))
                .send()
                .expect(403);
        });

        it('Should fail if the game does not exist.', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const game = await GameSeeding.default();
            await game.save();

            await agent
                .patch('/games/3')
                .set('Cookie', await cookieForUser(user))
                .send()
                .expect(404);
        });

        it('Should update if the user is a moderator.', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const game = await GameSeeding.withMode('Blitz');
            await game.save();

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
            const game = await GameSeeding.withMode('Blitz');
            await game.save();

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
        const templatePlayerObject = { player: { id: 1, language: 'css', username: 'username' }, team: { id: 1 } };
        let moderator: any = null;
        let game: any = null;

        beforeEach(async () => {
            moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();

            // remove the game players since tests are in relation to adding new players based on a
            // given id. Since the generation can create players that cause clashes and invalidates
            // the results.
            game = await GameSeeding.withMode('Blitz');
            delete game.storage.players;
            await game.save();
        });

        it('Should not allow adding a player when not authenticated', async () => {
            await agent
                .post('/games/1/player')
                .send()
                .expect(401);
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

        it('Should fail if team object is not specified.', async () => {
            const player = _.cloneDeep(templatePlayerObject);
            delete player.team;

            await agent
                .post(`/games/${game.id}/player`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(400, { error: await testSchemaValidation(player, addGamePlayerSchema) });
        });

        it('Should fail if team id is not specified.', async () => {
            const player = _.cloneDeep(templatePlayerObject);
            delete player.team.id;

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

            player.team.id = 2;

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
            game = await GameSeeding.withMode('Blitz');

            // work with a real existing player from the seeding.
            templatePlayerObject.player.id = game.storage.players[Object.keys(game.storage.players)[0]].id;
            await game.save();
        });

        it('Should not allow removing a user if a standard user.', async () => {
            await agent
                .delete('/games/1/player')
                .send()
                .expect(401);
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
                const game1 = await GameSeeding.withSeason(2);
                const game2 = await GameSeeding.withSeason(2);
                const game3 = await GameSeeding.withSeason(3);
                const game4 = await GameSeeding.withSeason(1);

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

            const response = await agent
                .get(`/games/season/${season.id}`)
                .send()
                .expect(200);

            chai.expect(response.body.length).to.be.eq(season.amount);
            _.forEach(response.body, (game: Game) => chai.expect(game.season).to.be.eq(season.id));
        });
    });
});
