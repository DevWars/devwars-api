import { EntityManager, getCustomRepository, getManager } from 'typeorm';
import * as supertest from 'supertest';
import * as chai from 'chai';

import GameRepository from '../app/repository/game.repository';
import { Connection } from '../app/services/connection.service';
import ServerService from '../app/services/server.service';

import { GameSeeding, UserSeeding } from '../app/seeding';
import { cookieForUser } from './helpers';

import { UserRole } from '../app/models/user.model';
import { GameMode, GameStatus } from '../app/models/game.model';

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
                .send({
                    startTime: game.startTime,
                    season: game.season,
                    mode: game.mode,
                    title: game.title,
                    videoUrl: null,
                    status: game.status,
                    templates: game.storage.templates,
                })
                .expect(403);
        });

        it('Should allow creating a game as a moderator or admin', async () => {
            for (const role of Object.values([UserRole.MODERATOR, UserRole.ADMIN])) {
                const user = await UserSeeding.withRole(role).save();

                let game = await GameSeeding.default().save();

                const response = await agent
                    .post('/games')
                    .set('Cookie', await cookieForUser(user))
                    .send({
                        startTime: game.startTime,
                        season: game.season,
                        mode: game.mode,
                        title: game.title,
                        videoUrl: null,
                        status: game.status,
                        templates: game.storage.templates,
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

        it('Should contain the templates if the templates are apart of the request', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const creatingGame = await GameSeeding.default().save();

            const templates = { html: 'html', css: 'css', js: 'js' };
            creatingGame.storage.templates = templates;

            const response = await agent
                .post('/games')
                .set('Cookie', await cookieForUser(user))
                .send({
                    startTime: creatingGame.startTime,
                    season: creatingGame.season,
                    mode: creatingGame.mode,
                    title: creatingGame.title,
                    videoUrl: null,
                    status: creatingGame.status,
                    templates,
                })
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

        it.skip('should gather additional player details if specified', async () => {
            //     const game = await (await GameSeeding.default().common()).save();
            //     const playerIds = Object.keys(game.storage.players);
            //     const [player] = playerIds;
            //     // standard endpoint test (no specification).
            //     const standardResponse = await agent.get(`/games/${game.id}`).expect(200);
            //     chai.expect(standardResponse.body.id).to.equal(game.id);
            //     chai.expect(Object.keys(standardResponse.body.players)).to.deep.equal(playerIds);
            //     chai.expect(standardResponse.body.players[player]).to.deep.equal(game.storage.players[player]);
            //     // standard endpoint test with false specification
            //     const standardFalseResponse = await agent.get(`/games/${game.id}?players=false`).expect(200);
            //     chai.expect(standardFalseResponse.body.id).to.deep.equal(game.id);
            //     chai.expect(Object.keys(standardFalseResponse.body.players)).to.deep.equal(playerIds);
            //     chai.expect(standardFalseResponse.body.players[player]).to.deep.equal(game.storage.players[player]);
            //     // standard endpoint call specifying true for players.
            //     const playersResponse = await agent.get(`/games/${game.id}?players=true`).expect(200);
            //     chai.expect(playersResponse.body.id).to.deep.equal(game.id);
            //     chai.expect(Object.keys(playersResponse.body.players)).to.deep.equal(playerIds);
            //     chai.expect(playersResponse.body.players[player]).to.not.equal(game.storage.players[player]);
            //     const userRepository = getCustomRepository(UserRepository);
            //     const storedPlayer = await userRepository.findById(player);
            //     chai.expect(_.isNil(storedPlayer)).to.not.be.equal(true);
            //     // How the server would merge the given users when specifying to include players.
            //     const mergedPlayer = JSON.stringify(
            //         Object.assign(game.storage.players[player], {
            //             avatarUrl: storedPlayer.avatarUrl,
            //             username: storedPlayer.username,
            //             id: storedPlayer.id,
            //             connections: [],
            //         })
            //     );
            //     chai.expect(JSON.parse(mergedPlayer)).to.deep.equal(playersResponse.body.players[player]);
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
});
