import * as supertest from 'supertest';
import { SuperTest, Test } from 'supertest';
import * as _ from 'lodash';

import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';
import { UserSeeding, GameSeeding, GameApplicationSeeding } from '../app/seeding';
import { UserRole } from '../app/models/user.model';
import { GameMode } from '../app/models/game.model';
import { cookieForUser } from './helpers';
import { testSchemaValidation } from '../app/routes/validators';
import { addGamePlayerSchema, removeGamePlayerSchema } from '../app/routes/validators/game.validator';
const server: ServerService = new ServerService();
let agent: SuperTest<Test>;

describe('Game Players', () => {
    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('GET - /:game/players - Adding a new player to the game', () => {
        it.skip('Should return a empty array if no players have been assigned');
        it.skip('Should return a array of assigned players if players have been assigned');
        it.skip('Should be allowed for all user types and not authenticated');
    });

    describe('POST - /:game/players - Adding a new player to the game', () => {
        const templatePlayerObject = (id: number) => ({ player: { id, language: 'css', team: 1 } });
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
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();
            await GameApplicationSeeding.withGameAndUser(game, user).save();

            await agent
                .post(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(user))
                .send(templatePlayerObject(user.id))
                .expect(201);
        });

        it('Should allow adding a player when authenticated user is a administrator.', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();
            await GameApplicationSeeding.withGameAndUser(game, user).save();

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

        it('Should fail if language is already assigned.', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();

            const application = GameApplicationSeeding.withGameAndUser(game, user);
            application.assignedLanguage = 'js';
            application.team = 0;

            await application.save();

            const newUser = await UserSeeding.withRole(UserRole.USER).save();

            const player = _.cloneDeep(templatePlayerObject(newUser.id));
            player.player.language = 'js';
            player.player.team = 0;

            await agent
                .post(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(409, { error: 'The given language is already assigned within the team' });
        });

        it('Should fail if the player already assigned and tried changing teams.', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            await GameApplicationSeeding.withGameAndUser(game, user).save();
            const player = _.cloneDeep(templatePlayerObject(user.id));

            await agent
                .post(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(201);

            player.player.team = 2;
            player.player.language = 'html';

            await agent
                .post(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(409, { error: 'The given user is already assigned to a team.' });
        });
    });

    describe('DELETE - /:game/players - Removing players from a game team.', () => {
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
            await agent.delete('/games/1/players').send().expect(401);
        });

        it('Should allow removing a user if a moderator user.', async () => {
            await agent
                .delete(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(templatePlayerObject)
                .expect(201);
        });

        it('Should allow removing a user if a administrator user.', async () => {
            const user = await UserSeeding.withRole(UserRole.ADMIN).save();

            await agent
                .delete(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(user))
                .send(templatePlayerObject)
                .expect(201);
        });

        it('Should fail if the player object does not exist.', async () => {
            const player = _.cloneDeep(templatePlayerObject);
            delete player.player;

            await agent
                .delete(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(400, { error: await testSchemaValidation(player, removeGamePlayerSchema) });
        });

        it('Should fail if the game does not exist.', async () => {
            await agent
                .delete(`/games/${game.id}1/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(templatePlayerObject)
                .expect(404);
        });

        it('Should fail if the player id does not exist.', async () => {
            const player = _.cloneDeep(templatePlayerObject);
            delete player.player.id;

            await agent
                .delete(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(400, { error: await testSchemaValidation(player, removeGamePlayerSchema) });
        });

        it('Should respond 201 if the user does not exist by the id', async () => {
            await agent
                .delete(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(templatePlayerObject)
                .expect(201);
        });

        it('Should respond 201 if the user not exist by the id', async () => {
            const player = _.cloneDeep(templatePlayerObject);
            player.player.id = -1;

            await agent
                .delete(`/games/${game.id}/players`)
                .set('Cookie', await cookieForUser(moderator))
                .send(player)
                .expect(201);
        });
    });
});
