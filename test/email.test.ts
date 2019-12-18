import * as chai from 'chai';
import * as supertest from 'supertest';

import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';
import { UserSeeding } from '../app/seeding';
import { cookieForUser } from './helpers';
import { UserRole } from '../app/models/User';

const server: ServerService = new ServerService();
let agent: any;

describe('Linked Account - Twitch', () => {
    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe.only('GET - /users/:userId/emails/permissions - Gathering email permissions', () => {
        let user: any = null;
        let admin: any = null;

        beforeEach(async () => {
            user = await UserSeeding.default().save();
            admin = await UserSeeding.withRole(UserRole.ADMIN).save();
        });

        it('Should fail if the user does not exist.', async () => {
            await agent
                .get('/users/99/emails/permissions')
                .set('Cookie', await cookieForUser(admin))
                .expect(404);
        });

        it('Should fail if the user is gathering for another user.', async () => {
            await agent
                .get(`/users/${admin.id}/emails/permissions`)
                .set('Cookie', await cookieForUser(user))
                .expect(403);
        });

        it('Should fail if the user is gathering for another user and is a moderator.', async () => {
            const mod = await UserSeeding.withRole(UserRole.MODERATOR).save();

            await agent
                .get(`/users/${user.id}/emails/permissions`)
                .set('Cookie', await cookieForUser(mod))
                .expect(403);
        });

        it('Should pass if the user exists.', async () => {
            await agent
                .get(`/users/${user.id}/emails/permissions`)
                .set('Cookie', await cookieForUser(user))
                .expect(200);
        });

        it('Should pass if the user is gathering for another user but is a admin.', async () => {
            await agent
                .get(`/users/${user.id}/emails/permissions`)
                .set('Cookie', await cookieForUser(admin))
                .expect(200);
        });
    });
});
