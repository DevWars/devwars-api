import * as chai from 'chai';
import * as supertest from 'supertest';
import { getCustomRepository } from 'typeorm';
import { isNil, isBoolean } from 'lodash';

import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';
import { UserSeeding } from '../app/seeding';
import { cookieForUser } from './helpers';
import { UserRole } from '../app/models/User';
import EmailOptInSeeding from '../app/seeding/EmailOptIn.seeding';
import EmailRepository from '../app/repository/EmailOptIn.repository';

const server: ServerService = new ServerService();
let agent: any;

describe('Emailing', () => {
    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('POST - /users/:userId/emails/permissions - Updating email permissions', () => {
        let user: any = null;
        let admin: any = null;

        beforeEach(async () => {
            user = await UserSeeding.default().save();
            await EmailOptInSeeding.default(user).save();

            admin = await UserSeeding.withRole(UserRole.ADMIN).save();
            await EmailOptInSeeding.default(admin).save();
        });

        it('Should update all values if specified.', async () => {
            const repository = getCustomRepository(EmailRepository);
            const emailOptIn: any = await repository.findOne({ where: { user } });

            chai.expect(isNil(emailOptIn)).to.be.eq(false);

            // Reverse all the boolean values to the ! of its current value.
            for (const emailKey of Object.keys(emailOptIn)) {
                if (isBoolean(emailOptIn[emailKey])) {
                    emailOptIn[emailKey] = !emailOptIn[emailKey];
                }
            }
            await agent
                .patch(`/users/${user.id}/emails/permissions`)
                .set('Cookie', await cookieForUser(user))
                .send(emailOptIn)
                .expect(200);

            const updatedOptIn: any = await repository.findOne({ where: { user } });
            chai.expect(isNil(updatedOptIn)).to.be.eq(false);

            // Reverse all the boolean values to the ! of its current value.
            for (const emailKey of Object.keys(updatedOptIn)) {
                if (isBoolean(emailOptIn[emailKey])) {
                    chai.expect(emailOptIn[emailKey]).to.be.eq(updatedOptIn[emailKey]);
                }
            }
        });

        it('Should not update any values if non specified.', async () => {
            const repository = getCustomRepository(EmailRepository);
            const emailOptIn: any = await repository.findOne({ where: { user } });

            await agent
                .patch(`/users/${user.id}/emails/permissions`)
                .set('Cookie', await cookieForUser(user))
                .expect(200);

            const emailOptInUpdated: any = await repository.findOne({ where: { user } });
            chai.expect(JSON.stringify(emailOptIn)).to.eq(JSON.stringify(emailOptInUpdated));
        });

        it('Should update the specified value for a given user.', async () => {
            const repository = getCustomRepository(EmailRepository);
            const emailOptIn = await repository.findOne({ where: { user } });

            await agent
                .patch(`/users/${user.id}/emails/permissions`)
                .set('Cookie', await cookieForUser(user))
                .send({ news: !emailOptIn.news })
                .expect(200);

            const emailOptInUpdated = await repository.findOne({ where: { user } });
            chai.expect(emailOptIn.news).to.not.eq(emailOptInUpdated.news);
        });

        it('Should fail if not authenticated', async () => {
            await agent.patch(`/users/${user.id}/emails/permissions`).expect(401);
        });

        it('Should fail if not not the owning user', async () => {
            const notOwningUser = await UserSeeding.withRole(UserRole.USER).save();

            await agent
                .patch(`/users/${user.id}/emails/permissions`)
                .set('Cookie', await cookieForUser(notOwningUser))
                .expect(403);
        });

        it('Should fail if updating another user as a moderator', async () => {
            const moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();
            await agent
                .patch(`/users/${user.id}/emails/permissions`)
                .set('Cookie', await cookieForUser(moderator))
                .expect(403);
        });

        it('Should update if updating another user as a administrator', async () => {
            await agent
                .patch(`/users/${user.id}/emails/permissions`)
                .set('Cookie', await cookieForUser(admin))
                .expect(200);
        });
    });

    describe('GET - /users/:userId/emails/permissions - Gathering email permissions', () => {
        let user: any = null;
        let admin: any = null;

        beforeEach(async () => {
            user = await UserSeeding.withRole(UserRole.USER).save();
            await EmailOptInSeeding.default(user).save();

            admin = await UserSeeding.withRole(UserRole.ADMIN).save();
            await EmailOptInSeeding.default(admin).save();
        });

        it('Should fail if not authenticated', async () => {
            await agent.get(`/users/${user.id}/emails/permissions`).expect(401);
        });

        it('Should fail if the user does not exist.', async () => {
            await agent
                .get('/users/999/emails/permissions')
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
