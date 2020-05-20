import * as supertest from 'supertest';
import * as chai from 'chai';
import * as _ from 'lodash';

import ServerService from '../app/services/Server.service';
import { UserRole } from '../app/models/user.model';
import { UserSeeding } from '../app/seeding';
import { cookieForUser } from './helpers';

const server: ServerService = new ServerService();
let agent: supertest.SuperTest<supertest.Test> = null;

describe('Health', () => {
    before(async () => {
        await server.Start();
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('GET - /health - Get the related health information of the server', async () => {
        it('should return healthy and the current version number', async () => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const packageJson = require('../package');
            await agent.get('/health').expect(200, {
                status: 'Healthy',
                version: packageJson.version,
            });
        });
    });

    describe('GET - /health/logs - Get the related server logs', async () => {
        it('should fail if you are not a moderator or higher', async () => {
            for (const role of [UserRole.PENDING, UserRole.USER]) {
                const user = await UserSeeding.withRole(role).save();

                await agent
                    .get('/health/logs')
                    .set('Cookie', await cookieForUser(user))
                    .expect(403, { error: "Unauthorized, you currently don't meet the minimal requirement." });
            }
        });

        it('should not fail if you are a moderator or higher', async () => {
            for (const role of [UserRole.MODERATOR, UserRole.ADMIN]) {
                const user = await UserSeeding.withRole(role).save();

                const response = await agent
                    .get('/health/logs')
                    .set('Cookie', await cookieForUser(user))
                    .expect(200);

                chai.expect(_.isArray(response.body.logs)).to.be.eq(true);
            }
        });
    });

    describe('GET - /health/logs/error - Get the related server error logs', async () => {
        it('should fail if you are not a moderator or higher', async () => {
            for (const role of [UserRole.PENDING, UserRole.USER]) {
                const user = await UserSeeding.withRole(role).save();

                await agent
                    .get('/health/logs/error')
                    .set('Cookie', await cookieForUser(user))
                    .expect(403, { error: "Unauthorized, you currently don't meet the minimal requirement." });
            }
        });

        it('should not fail if you are a moderator or higher', async () => {
            for (const role of [UserRole.MODERATOR, UserRole.ADMIN]) {
                const user = await UserSeeding.withRole(role).save();

                const response = await agent
                    .get('/health/logs/error')
                    .set('Cookie', await cookieForUser(user))
                    .expect(200);

                chai.expect(_.isArray(response.body.logs)).to.be.eq(true);
            }
        });
    });
});
