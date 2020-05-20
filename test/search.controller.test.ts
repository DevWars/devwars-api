import * as supertest from 'supertest';
import * as chai from 'chai';

import { UserSeeding, GameSeeding } from '../app/seeding';

import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';
import { cookieForUser } from './helpers';

import User, { UserRole } from '../app/models/user.model';

const server: ServerService = new ServerService();
let agent: any;

describe('search', () => {
    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('GET - /search/users?username=:username&limit=:limit - Performing username based like lookup', () => {
        const lookupUrl = '/search/users?username=testing&limit=3';
        let moderator: User = null;

        beforeEach(async () => {
            moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();
        });

        it('Should reject not authenticated users', async () => {
            await agent.get(lookupUrl).expect(401);
        });

        it('Should reject users not a minimum role of moderator', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();

            await agent
                .get(lookupUrl)
                .set('Cookie', await cookieForUser(user))
                .send()
                .expect(403);
        });

        it('Should allow moderator and admins', async () => {
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
                .get('/search/users')
                .set('Cookie', await cookieForUser(moderator))
                .send()
                .expect(400, {
                    error: 'One of the specified username or email within the query must not be empty.',
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
                    .get(`/search/users?username=e&limit=${test[0]}`)
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

    describe('GET - /search/games?title=:title&limit=:limit - Performing games title based like lookup', () => {
        const lookupUrl = '/search/games?title=testing&limit=3';
        let moderator: User = null;

        beforeEach(async () => {
            moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();
        });

        it('Should reject not authenticated users', async () => {
            await agent.get(lookupUrl).expect(401);
        });

        it('Should reject users not a minimum role of moderator', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();

            await agent
                .get(lookupUrl)
                .set('Cookie', await cookieForUser(user))
                .send()
                .expect(403);
        });

        it('Should allow moderator and admins', async () => {
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

        it('Should reject if the given title is not provided', async () => {
            await agent
                .get('/search/games')
                .set('Cookie', await cookieForUser(moderator))
                .send()
                .expect(400, {
                    error: 'The specified title within the query must not be empty.',
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
                    .get(`/search/games?title=testing&limit=${test[0]}`)
                    .set('Cookie', await cookieForUser(moderator))
                    .send();

                // less than or equal since user generation is not as expected and the results could
                // diff based on seeding.
                chai.expect(response.body.length <= test[1]).to.be.eq(true);
            }
        });

        it("Should return related games when looking up 'testing'", async () => {
            const titles = ['testing-one', 'testing-two', 'testing-three'];

            for (const title of titles) {
                const game = GameSeeding.default().game;
                game.title = title;

                await game.save();
            }

            const response = await agent
                .get(lookupUrl)
                .set('Cookie', await cookieForUser(moderator))
                .send();

            chai.expect(response.body.length).to.be.eq(3);

            for (const games of response.body) {
                chai.expect(titles).to.include(games.title);
                chai.expect(games.id).to.not.eq(undefined);
                chai.expect(games.id).to.not.eq(null);
            }
        });
    });
});
