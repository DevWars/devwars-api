import { getManager, EntityManager, getCustomRepository } from 'typeorm';
import * as supertest from 'supertest';
import * as chai from 'chai';
import * as _ from 'lodash';

import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';
import { cookieForUser } from './helpers';
import User, { UserRole } from '../app/models/User';
import { UserSeeding } from '../app/seeding';

const server: ServerService = new ServerService();
let agent: any;

describe('user', () => {
    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('GET - /users/lookup?username=:username&limit=:limit - Performing username based like lookup', () => {
        const lookupUrl = '/users/lookup?username=testing&limit=3';
        let moderator: User = null;

        beforeEach(async () => {
            moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();
        });

        it('Should reject not authenticated users.', async () => {
            await agent.get(lookupUrl).expect(401);
        });

        it('Should reject users not a minimum role of moderator.', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();

            await agent
                .get(lookupUrl)
                .set('Cookie', await cookieForUser(user))
                .send()
                .expect(403);
        });

        it('Should allow moderator and admins.', async () => {
            const admin = await UserSeeding.withRole(UserRole.ADMIN).save();

            for (const test of [
                [moderator, 200],
                [admin, 200],
            ]) {
                await agent
                    .get(lookupUrl)
                    .set('Cookie', await cookieForUser(test[0] as User))
                    .send()
                    .expect(test[1]);
            }
        });

        it('Should reject if the given username is not provided', async () => {
            await agent
                .get('/users/lookup')
                .set('Cookie', await cookieForUser(moderator))
                .send()
                .expect(400, {
                    error: 'The specified username within the query must not be empty.',
                });
        });

        it('Should respect the limit if specified', async () => {
            for (const test of [
                [50, 50],
                [1, 1],
                [10, 10],
                [500, 50],
            ]) {
                const response = await agent
                    .get(`/users/lookup?username=e&limit=${test[0]}`)
                    .set('Cookie', await cookieForUser(moderator))
                    .send();

                // less than or equal since user generation is not as expected and the results could
                // diff based on seeding.
                chai.expect(response.body.length <= test[1]).to.be.eq(true);
            }
        });

        it("Should return related users when looking up 'testing'", async () => {
            const users = ['one', 'two', 'three'];

            for (const user of users) {
                await UserSeeding.withUsername(`testing-${user}`).save();
            }

            const response = await agent
                .get(lookupUrl)
                .set('Cookie', await cookieForUser(moderator))
                .send();

            chai.expect(response.body.length).to.be.eq(3);

            for (const user of response.body) {
                chai.expect(users).to.include(user.username.split('-')[1]);
                chai.expect(user.id).to.not.eq(undefined);
                chai.expect(user.id).to.not.eq(null);
            }
        });
    });
});
