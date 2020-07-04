import * as supertest from 'supertest';
import * as chai from 'chai';

import { Connection } from '../app/services/connection.service';
import ServerService from '../app/services/server.service';
import { UserSeeding, GameApplicationSeeding, GameSeeding } from '../app/seeding';
import { cookieForUser } from './helpers';
import User, { UserRole } from '../app/models/user.model';
import Game from '../app/models/game.model';

const server: ServerService = new ServerService();
let agent: any;

describe('User Games', () => {
    let user: User;
    let game: Game;

    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(async () => {
        user = await UserSeeding.default().save();
        game = await GameSeeding.default().save();
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('GET - /users/:user/games - Get the related users games.', () => {
        it('Should return no games when the given user has none', async () => {
            await agent
                .get(`/users/${user.id}/games`)
                .set('cookie', await cookieForUser(user))
                .expect(200, []);
        });

        it('Should return the users games if the user has them', async () => {
            for (let index = 0; index < 3; index++) {
                const game = await GameSeeding.default().save();
                const application = GameApplicationSeeding.withGameAndUser(game, user);
                application.assignedLanguages = ['js'];
                application.team = 0;

                await application.save();
            }

            const response = await agent
                .get(`/users/${user.id}/games`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(3);
        });

        it('Should fail if you are not the owning user and not a admin or moderator', async () => {
            const notOwning = await UserSeeding.withRole(UserRole.USER).save();

            const response = await agent
                .get(`/users/${user.id}/games`)
                .set('cookie', await cookieForUser(notOwning))
                .send();

            chai.expect(response.status).to.be.equal(403);
        });

        it('Should pass if you are not the owning user and a admin or moderator', async () => {
            for (const role of [UserRole.ADMIN, UserRole.MODERATOR]) {
                const notOwning = await UserSeeding.withRole(role).save();

                const response = await agent
                    .get(`/users/${user.id}/games`)
                    .set('cookie', await cookieForUser(notOwning))
                    .send();

                chai.expect(response.status).to.be.equal(200);
            }
        });
    });

    describe('GET - /users/:user/games/:game - Get the related users game.', () => {
        it('Should fail if the user has no game for that id', async () => {
            const response = await agent
                .get(`/users/${user.id}/games/99`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(404);
            chai.expect(response.body.error).to.be.equal(
                'The user did not play in the provided game or it does not exist.'
            );
        });

        it('Should return the users game if the user has one', async () => {
            const application = GameApplicationSeeding.withGameAndUser(game, user);
            application.assignedLanguages = ['js'];
            application.team = 0;

            await application.save();

            const response = await agent
                .get(`/users/${user.id}/games/${game.id}`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.id).to.be.equal(game.id);
            chai.expect(response.body.id).to.be.equal(game.id);
        });

        it('Should fail if you are not the owning user and not a admin or moderator', async () => {
            const application = GameApplicationSeeding.withGameAndUser(game, user);
            application.assignedLanguages = ['js'];
            application.team = 0;

            await application.save();

            const notOwning = await UserSeeding.withRole(UserRole.USER).save();

            const response = await agent
                .get(`/users/${user.id}/games/${game.id}`)
                .set('cookie', await cookieForUser(notOwning))
                .send();

            chai.expect(response.status).to.be.equal(403);
        });

        it('Should pass if you are not the owning user and a admin or moderator', async () => {
            const application = GameApplicationSeeding.withGameAndUser(game, user);
            application.assignedLanguages = ['js'];
            application.team = 0;

            await application.save();

            for (const role of [UserRole.ADMIN, UserRole.MODERATOR]) {
                const notOwning = await UserSeeding.withRole(role).save();

                const response = await agent
                    .get(`/users/${user.id}/games/${game.id}`)
                    .set('cookie', await cookieForUser(notOwning))
                    .send();

                chai.expect(response.status).to.be.equal(200);
            }
        });
    });
});
