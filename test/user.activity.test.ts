import * as supertest from 'supertest';
import * as chai from 'chai';

import { Connection } from '../app/services/connection.service';
import ServerService from '../app/services/server.service';
import { UserSeeding, ActivitySeeding } from '../app/seeding';
import { cookieForUser } from '../app/utils/helpers';
import User, { UserRole } from '../app/models/user.model';

const server: ServerService = new ServerService();
let agent: any;

describe('User Activity', () => {
    let user: User;

    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(async () => {
        user = await UserSeeding.default().save();
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('GET - /users/:user/activities - Get the related users activities.', () => {
        it('Should return no activities when the given user has none', async () => {
            await agent
                .get(`/users/${user.id}/activities`)
                .set('cookie', await cookieForUser(user))
                .expect(200, []);
        });

        it('Should return the users activities if the user has them', async () => {
            await ActivitySeeding.withUser(user).save();
            await ActivitySeeding.withUser(user).save();
            await ActivitySeeding.withUser(user).save();

            const response = await agent
                .get(`/users/${user.id}/activities`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.length).to.be.equal(3);
        });

        it('Should pass if you are not the owning user and a admin or moderator', async () => {
            for (const role of [UserRole.ADMIN, UserRole.MODERATOR]) {
                const notOwning = await UserSeeding.withRole(role).save();

                const response = await agent
                    .get(`/users/${user.id}/activities`)
                    .set('cookie', await cookieForUser(notOwning))
                    .send();

                chai.expect(response.status).to.be.equal(200);
            }
        });
    });

    describe('GET - /users/:user/activities/:activity - Get the related users activity.', () => {
        it('Should fail if the user has no activity for that id', async () => {
            const response = await agent
                .get(`/users/${user.id}/activities/99`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(404);
            chai.expect(response.body.error).to.be.equal('The activity does not exist by the provided id.');
        });

        it('Should fail if the activity is not a number', async () => {
            const response = await agent
                .get(`/users/${user.id}/activities/null`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(400);
            chai.expect(response.body.error).to.be.equal('Invalid activity id was provided.');
        });

        it('Should return the users activity if the user has one', async () => {
            const activity = await ActivitySeeding.withUser(user).save();

            const response = await agent
                .get(`/users/${user.id}/activities/${activity.id}`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.id).to.be.equal(activity.id);
            chai.expect(response.body.coins).to.be.equal(activity.coins);
            chai.expect(response.body.xp).to.be.equal(activity.xp);
            chai.expect(response.body.description).to.be.equal(activity.description);
        });

        it('Should pass if you are not the owning user and a admin or moderator', async () => {
            for (const role of [UserRole.ADMIN, UserRole.MODERATOR]) {
                const activity = await ActivitySeeding.withUser(user).save();
                const notOwning = await UserSeeding.withRole(role).save();

                const response = await agent
                    .get(`/users/${user.id}/activities/${activity.id}`)
                    .set('cookie', await cookieForUser(notOwning))
                    .send();

                chai.expect(response.status).to.be.equal(200);
            }
        });
    });
});
