import { EntityManager, getCustomRepository, getManager } from 'typeorm';
import * as supertest from 'supertest';
import * as chai from 'chai';
import * as _ from 'lodash';

import GameRepository from '../app/repository/game.repository';
import { Connection } from '../app/services/connection.service';
import ServerService from '../app/services/server.service';

import { GameSeeding, UserSeeding } from '../app/seeding';
import { cookieForUser } from '../app/utils/helpers';

import User, { UserRole } from '../app/models/user.model';
import Game, { GameMode } from '../app/models/game.model';
import GameApplicationRepository from '../app/repository/gameApplication.repository';
import GameSourceRepository from '../app/repository/gameSource.repository';

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
        const gameSourceRepository = getCustomRepository(GameSourceRepository);

        await gameSourceRepository.delete({});
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

            const response = await agent.get('/games?first=2').send().expect(200);
            chai.expect(response.body.data.length).to.be.equal(2);
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

    describe('DELETE - /games/:game - Remove the game', () => {
        let game: Game;
        let administrator: User;

        beforeEach(async () => {
            game = await GameSeeding.default().save();
            administrator = await UserSeeding.withRole(UserRole.ADMIN).save();
        });

        it('Should fail if the user is not authenticated', async () => {
            const response = await agent.delete(`/games/${game.id}`);
            chai.expect(response.status).to.be.equal(401);
        });

        it('Should fail if the user is not a moderator or higher and not set user', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();

            const response = await agent
                .delete(`/games/${game.id}`)
                .set('Cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(403);
        });

        it('Should pass if the user is a admin or higher and not set user', async () => {
            for (const role of [UserRole.ADMIN]) {
                const user = await UserSeeding.withRole(role).save();

                const response = await agent
                    .delete(`/games/${game.id}`)
                    .set('Cookie', await cookieForUser(user))
                    .send();

                chai.expect(response.status).to.be.equal(200);
            }
        });

        it('Should remove the game if completed', async () => {
            const response = await agent
                .delete(`/games/${game.id}`)
                .set('Cookie', await cookieForUser(administrator))
                .send();

            chai.expect(response.status).to.be.equal(200);

            const gameRepository = getCustomRepository(GameRepository);
            const gameRemoved = await gameRepository.findOne({ where: { id: game.id } });

            chai.expect(_.isNil(gameRemoved)).to.be.equal(true);
        });

        it('Should remove the game applications if the any when deleting the game.', async () => {
            const gamePrepare = await GameSeeding.default().common();
            const game = await gamePrepare.save();

            const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
            const applications = await gameApplicationRepository.findByGame(game);

            chai.expect(applications.length).to.be.greaterThan(0);

            const response = await agent
                .delete(`/games/${game.id}`)
                .set('Cookie', await cookieForUser(administrator))
                .send();

            chai.expect(response.status).to.be.equal(200);

            const updatedApplications = await gameApplicationRepository.findByGame(game);
            chai.expect(updatedApplications.length).to.be.equal(0);
        });
    });

    describe('GET - /games/:id/source - Get game source for existing games', () => {
        it('Should return all games in the system.', async () => {
            const game = await GameSeeding.default().WithTemplates().save();
            await game.save();

            const response = await agent.get(`/games/${game.id}/source`).send().expect(200);
            chai.expect(response.body.length).to.be.equal(6); // the total languages (total languages per team)
        });
    });

    describe('GET - /games/:id/source/:team - Get game source for a given team', () => {
        it('Should only return sources for the given team.', async () => {
            const game = await GameSeeding.default().WithTemplates().save();
            await game.save();

            const response = await agent.get(`/games/${game.id}/source/1`).send().expect(200);
            chai.expect(response.body.length).to.be.equal(3); // the total languages (total languages per team)

            for (const source of response.body) {
                chai.expect(source.team).to.be.equal(1);
            }
        });
    });

    describe('GET - /games/:id/source/:team/:file - Get game source for a given team and file', () => {
        it('Should only return sources for the given team and language as a raw string.', async () => {
            const game = await GameSeeding.default().WithTemplates().save();

            const response = await agent.get(`/games/${game.id}/source/1/game.js`).send().expect(200);
            chai.expect(response.text).to.be.equal(game.storage.templates.js);
        });
    });
});
