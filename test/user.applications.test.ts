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

describe.only('User Application', () => {
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

    describe('GET - /users/:user/applications - Get the related users applications.', () => {
        it('Should return no applications when the given user has none', async () => {
            await agent
                .get(`/users/${user.id}/applications`)
                .set('cookie', await cookieForUser(user))
                .expect(200, []);
        });

        it('Should return the users applications if the user has them', async () => {
            await GameApplicationSeeding.withGameAndUser(game, user).save();
            await GameApplicationSeeding.withGameAndUser(game, user).save();
            await GameApplicationSeeding.withGameAndUser(game, user).save();

            const response = await agent
                .get(`/users/${user.id}/applications`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(3);
        });

        it('Should fail if you are not the owning user and not a admin or moderator', async () => {
            const notOwning = await UserSeeding.withRole(UserRole.USER).save();

            const response = await agent
                .get(`/users/${user.id}/applications`)
                .set('cookie', await cookieForUser(notOwning))
                .send();

            chai.expect(response.status).to.be.equal(403);
        });

        it('Should pass if you are not the owning user and a admin or moderator', async () => {
            for (const role of [UserRole.ADMIN, UserRole.MODERATOR]) {
                const notOwning = await UserSeeding.withRole(role).save();

                const response = await agent
                    .get(`/users/${user.id}/applications`)
                    .set('cookie', await cookieForUser(notOwning))
                    .send();

                chai.expect(response.status).to.be.equal(200);
            }
        });
    });

    describe('GET - /users/:user/applications/:application - Get the related users application.', () => {
        it('Should fail if the user has no application for that id', async () => {
            const response = await agent
                .get(`/users/${user.id}/applications/99`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(404);
            chai.expect(response.body.error).to.be.equal('The application does not exist by the provided id.');
        });

        it('Should return the users application if the user has one', async () => {
            const application = await GameApplicationSeeding.withGameAndUser(game, user).save();

            const response = await agent
                .get(`/users/${user.id}/applications/${application.id}`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.id).to.be.equal(application.id);
            chai.expect(response.body.assignedLanguage).to.be.equal(application.assignedLanguage);
            chai.expect(response.body.team).to.be.equal(application.team);
        });

        it('Should fail if you are not the owning user and not a admin or moderator', async () => {
            const application = await GameApplicationSeeding.withGameAndUser(game, user).save();
            const notOwning = await UserSeeding.withRole(UserRole.USER).save();

            const response = await agent
                .get(`/users/${user.id}/applications/${application.id}`)
                .set('cookie', await cookieForUser(notOwning))
                .send();

            chai.expect(response.status).to.be.equal(403);
        });

        it('Should pass if you are not the owning user and a admin or moderator', async () => {
            for (const role of [UserRole.ADMIN, UserRole.MODERATOR]) {
                const application = await GameApplicationSeeding.withGameAndUser(game, user).save();
                const notOwning = await UserSeeding.withRole(role).save();

                const response = await agent
                    .get(`/users/${user.id}/applications/${application.id}`)
                    .set('cookie', await cookieForUser(notOwning))
                    .send();

                chai.expect(response.status).to.be.equal(200);
            }
        });
    });
});
