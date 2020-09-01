import * as supertest from 'supertest';
import { SuperTest, Test } from 'supertest';
import * as chai from 'chai';
import * as _ from 'lodash';

import { Connection } from '../app/services/connection.service';
import ServerService from '../app/services/server.service';
import { UserSeeding, GameSeeding, GameApplicationSeeding } from '../app/seeding';
import { UserRole } from '../app/models/user.model';
import { GameMode } from '../app/models/game.model';
import { cookieForUser } from './helpers';
import { testSchemaValidation } from '../app/routes/validators';
import { addGamePlayerSchema, removeGamePlayerSchema } from '../app/routes/validators/game.validator';
const server: ServerService = new ServerService();
let agent: SuperTest<Test>;

describe('Game Players', () => {
    let moderator: any = null;
    let game: any = null;

    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(async () => {
        agent = supertest.agent(server.App());

        moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();
        game = await GameSeeding.default().withMode(GameMode.Classic).save();
        await game.save();
    });

    describe('GET - /:game/players - Adding a new player to the game', () => {
        it('Should return a empty array if no players have been assigned', async () => {
            await agent
                .get(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .expect(200, []);
        });

        it('Should return a array of assigned players if players have been assigned', async () => {
            const application = GameApplicationSeeding.withGameAndUser(game, moderator);
            application.assignedLanguages = ['html'];
            application.team = 0;

            await application.save();

            const user = await UserSeeding.withRole(UserRole.USER).save();
            const applicationTwo = GameApplicationSeeding.withGameAndUser(game, user);
            applicationTwo.assignedLanguages = ['html'];
            applicationTwo.team = 0;

            await applicationTwo.save();

            const response = await agent.get(`/games/${game.id}/players`).set('Cookie', await cookieForUser(moderator));

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(2);

            for (const app of response.body) {
                chai.expect(_.isNil(app.user)).to.be.equal(false);
            }
        });
    });

    describe('POST - /:game/players - Adding a new player to the game', () => {
        const templatePlayerObject = (id: number) => ({ player: { id, language: 'css', team: 1 } });

        it('Should not allow adding a player when not authenticated', async () => {
            await agent.post('/games/1/players').send().expect(401);
        });

        it('Should not allow adding a player when authenticated user is a standard user.', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            await GameApplicationSeeding.withGameAndUser(game, user).save();

            await agent
                .post(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(user))
                .send(templatePlayerObject(user.id))
                .expect(403);
        });

        it('Should allow adding a player when authenticated user is a moderator.', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            await GameApplicationSeeding.withGameAndUser(game, user, true).save();

            const response = await agent
                .post(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(templatePlayerObject(user.id));

            chai.expect(response.status).to.be.equal(201);
        });

        it('Should allow adding a player when authenticated user is a administrator.', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();
            await GameApplicationSeeding.withGameAndUser(game, user, true).save();

            await agent
                .post(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(user))
                .send(templatePlayerObject(user.id))
                .expect(201);
        });

        it('Should fail if player object is not specified.', async () => {
            const player = templatePlayerObject(moderator.id);
            delete player.player;

            await agent
                .post(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(400, { error: await testSchemaValidation(player, addGamePlayerSchema) });
        });

        it('Should fail if player id is not specified.', async () => {
            const player = templatePlayerObject(moderator.id);
            delete player.player.id;

            await agent
                .post(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(400, { error: await testSchemaValidation(player, addGamePlayerSchema) });
        });

        it('Should fail if player language is not specified.', async () => {
            const player = templatePlayerObject(moderator.id);
            delete player.player.language;

            await agent
                .post(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(400, { error: await testSchemaValidation(player, addGamePlayerSchema) });
        });

        it('Should fail if the language is already assigned.', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();

            const application = GameApplicationSeeding.withGameAndUser(game, user, true);
            application.assignedLanguages = ['js'];
            application.team = 0;

            await application.save();

            const newUser = await UserSeeding.withRole(UserRole.USER).save();
            await GameApplicationSeeding.withGameAndUser(game, newUser, true).save();

            const player = _.cloneDeep(templatePlayerObject(newUser.id));
            player.player.language = 'js';
            player.player.team = 0;

            const response = await agent
                .post(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player);

            chai.expect(response.status).to.be.equal(409);
            chai.expect(response.body.error).to.be.equal('The given language is already assigned within the team');
        });

        it('Should fail if the player already assigned and tried changing teams.', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            await GameApplicationSeeding.withGameAndUser(game, user, true).save();
            const player = _.cloneDeep(templatePlayerObject(user.id));

            await agent
                .post(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(201);

            player.player.team = 2;

            await agent
                .post(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(409, { error: 'The given user is assigned to another team.' });
        });
    });

    describe('DELETE - /:game/players - Removing players from a game team.', () => {
        let user: any = null;

        beforeEach(async () => {
            user = await UserSeeding.withRole(UserRole.ADMIN).save();

            const application = GameApplicationSeeding.withGameAndUser(game, user);
            application.assignedLanguages = ['html'];
            application.team = 0;

            await application.save();
        });

        it('Should not allow removing a user if a standard user.', async () => {
            await agent.delete('/games/1/players').send().expect(401);
        });

        it('Should allow removing a user if a moderator user.', async () => {
            await agent
                .delete(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send({ player: { id: user.id } })
                .expect(200);
        });

        it('Should allow removing a user if a administrator user.', async () => {
            await agent
                .delete(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send({ player: { id: user.id } })
                .expect(200);
        });

        it('Should fail if the player object does not exist.', async () => {
            await agent
                .delete(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send({})
                .expect(400, { error: await testSchemaValidation({}, removeGamePlayerSchema) });
        });

        it('Should fail if the game does not exist.', async () => {
            await agent
                .delete(`/games/${game.id}1/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send({ player: { id: user.id } })
                .expect(404);
        });

        it('Should fail if the player id does not exist.', async () => {
            await agent
                .delete(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send({ player: {} })
                .expect(400, { error: await testSchemaValidation({ player: {} }, removeGamePlayerSchema) });
        });

        it('Should respond 200 if the user does not exist by the id', async () => {
            await agent
                .delete(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send({ player: { id: 999 } })
                .expect(200);
        });
    });
});
