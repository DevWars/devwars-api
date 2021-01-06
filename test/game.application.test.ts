import * as chai from 'chai';
import * as supertest from 'supertest';
import { Connection } from '../app/services/connection.service';
import ServerService from '../app/services/server.service';
import { UserSeeding, GameSeeding, GameApplicationSeeding } from '../app/seeding';
import User, { UserRole } from '../app/models/user.model';
import { cookieForUser } from '../app/utils/helpers';
import Game from '../app/models/game.model';
const server: ServerService = new ServerService();
let agent: supertest.SuperTest<supertest.Test> = null;

describe('Game Applications', () => {
    let moderator: User;
    let game: Game;

    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(async () => {
        agent = supertest.agent(server.App());
        game = await GameSeeding.default().save();
        moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();
    });

    describe('GET - /games/:game/applications - Get all game applications', () => {
        it('Should fail if the user is not a moderator or higher', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();

            const response = await agent.get(`/games/${game.id}/applications`).set('Cookie', await cookieForUser(user));
            chai.expect(response.status).to.be.equal(403);

            for (const role of [UserRole.MODERATOR, UserRole.ADMIN]) {
                const roleUser = await UserSeeding.withRole(role).save();

                const roleResponse = await agent
                    .get(`/games/${game.id}/applications`)
                    .set('Cookie', await cookieForUser(roleUser));

                chai.expect(roleResponse.status).to.be.equal(200);
            }
        });

        it('Should only return related game applications', async () => {
            const secondGame = await (await GameSeeding.default().withGeneratedPlayers(2)).save();

            let response = await agent
                .get(`/games/${game.id}/applications`)
                .set('Cookie', await cookieForUser(moderator));

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(0);

            response = await agent
                .get(`/games/${secondGame.id}/applications`)
                .set('Cookie', await cookieForUser(moderator));

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(2);
        });
    });

    describe('POST - /games/:game/applications/:user - Apply to game with application.', () => {
        it('Should fail if not the owner and the user is not a moderator or higher and not set user', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            const requestingUser = await UserSeeding.withRole(UserRole.USER).save();

            const response = await agent
                .post(`/games/${game.id}/applications/${user.id}`)
                .set('Cookie', await cookieForUser(requestingUser));

            chai.expect(response.status).to.be.equal(403);
        });

        it('Should pass if the user is a moderator or higher and not set user', async () => {
            for (const role of [UserRole.MODERATOR, UserRole.ADMIN]) {
                const user = await UserSeeding.withComponents(null, null, role).save();
                const requestingUser = await UserSeeding.withComponents(null, null, role).save();

                const response = await agent
                    .post(`/games/${game.id}/applications/${user.id}`)
                    .set('Cookie', await cookieForUser(requestingUser));

                chai.expect(response.status).to.be.equal(200);
            }
        });

        it('Should fail if the given user is already applied', async () => {
            const user = await UserSeeding.withComponents(null, null, UserRole.USER).save();

            let response = await agent
                .post(`/games/${game.id}/applications/${user.id}`)
                .set('Cookie', await cookieForUser(user));

            chai.expect(response.status).to.be.equal(200);

            response = await agent
                .post(`/games/${game.id}/applications/${user.id}`)
                .set('Cookie', await cookieForUser(user));

            chai.expect(response.status).to.be.equal(409);
            chai.expect(response.body.error).to.be.equal('A application already exists for the specified game.');
        });

        it('Should apply to the given game if not already applied', async () => {
            const user = await UserSeeding.withComponents(null, null, UserRole.USER).save();

            const response = await agent
                .post(`/games/${game.id}/applications/${user.id}`)
                .set('Cookie', await cookieForUser(user));

            chai.expect(response.status).to.be.equal(200);
        });
    });

    describe('GET - /games/:game/applications/:user - Get the users application to game.', () => {
        it('Should fail if the user is not a moderator or higher and not set user', async () => {
            const user = await UserSeeding.withComponents(null, null, UserRole.USER).save();
            const requestingUser = await UserSeeding.withComponents(null, null, UserRole.USER).save();

            const response = await agent
                .get(`/games/${game.id}/applications/${user.id}`)
                .set('Cookie', await cookieForUser(requestingUser));

            chai.expect(response.status).to.be.equal(403);
        });

        it('Should pass if the user is a moderator or higher and not set user', async () => {
            for (const role of [UserRole.MODERATOR, UserRole.ADMIN]) {
                const user = await UserSeeding.withComponents(null, null, UserRole.USER).save();
                await GameApplicationSeeding.withGameAndUser(game, user).save();

                const requestingUser = await UserSeeding.withRole(role).save();

                const response = await agent
                    .get(`/games/${game.id}/applications/${user.id}`)
                    .set('Cookie', await cookieForUser(requestingUser));

                chai.expect(response.status).to.be.equal(200);
            }
        });

        it('Should fail if the given user is not applied', async () => {
            const user = await UserSeeding.withComponents(null, null, UserRole.USER).save();

            const response = await agent
                .get(`/games/${game.id}/applications/${user.id}`)
                .set('Cookie', await cookieForUser(user));

            chai.expect(response.status).to.be.equal(409);
            chai.expect(response.body.error).to.be.equal('A application does not exists for the specified game.');
        });

        it('Should return the users application if applied.', async () => {
            const user = await UserSeeding.withComponents(null, null, UserRole.USER).save();
            const application = await GameApplicationSeeding.withGameAndUser(game, user).save();

            const response = await agent
                .get(`/games/${game.id}/applications/${user.id}`)
                .set('Cookie', await cookieForUser(user));

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.id).to.be.equal(application.id);
            chai.expect(response.body.assignedLanguages[0]).to.be.equal(application.assignedLanguages[0]);
            chai.expect(response.body.team).to.be.equal(application.team);
        });
    });

    describe('DELETE - /games/:game/applications/:user - Remove the users application to game.', () => {
        it('Should fail if the user is not a moderator or higher and not set user', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            const requestingUser = await UserSeeding.withRole(UserRole.USER).save();

            const response = await agent
                .delete(`/games/${game.id}/applications/${user.id}`)
                .set('Cookie', await cookieForUser(requestingUser));

            chai.expect(response.status).to.be.equal(403);
        });

        it('Should pass if the user is a moderator or higher and not set user', async () => {
            for (const role of [UserRole.MODERATOR, UserRole.ADMIN]) {
                const user = await UserSeeding.withComponents(null, null, UserRole.USER).save();
                await GameApplicationSeeding.withGameAndUser(game, user).save();

                const requestingUser = await UserSeeding.withComponents(null, null, role).save();

                const response = await agent
                    .delete(`/games/${game.id}/applications/${user.id}`)
                    .set('Cookie', await cookieForUser(requestingUser));

                chai.expect(response.status).to.be.equal(200);
            }
        });

        it('Should fail if the given user is not applied', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();

            const response = await agent
                .get(`/games/${game.id}/applications/${user.id}`)
                .set('Cookie', await cookieForUser(user));

            chai.expect(response.status).to.be.equal(409);
            chai.expect(response.body.error).to.be.equal('A application does not exists for the specified game.');
        });

        it('Should remove the application if the user is applied.', async () => {
            const user = await UserSeeding.withComponents(null, null, UserRole.USER).save();
            await GameApplicationSeeding.withGameAndUser(game, user).save();

            let response = await agent
                .get(`/games/${game.id}/applications/${user.id}`)
                .set('Cookie', await cookieForUser(user));

            chai.expect(response.status).to.be.equal(200);

            response = await agent
                .delete(`/games/${game.id}/applications/${user.id}`)
                .set('Cookie', await cookieForUser(user));

            chai.expect(response.status).to.be.equal(200);

            response = await agent
                .get(`/games/${game.id}/applications/${user.id}`)
                .set('Cookie', await cookieForUser(user));

            chai.expect(response.status).to.be.equal(409);
            chai.expect(response.body.error).to.be.equal('A application does not exists for the specified game.');
        });
    });
});
