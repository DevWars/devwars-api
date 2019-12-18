import { getManager, EntityManager, getCustomRepository } from 'typeorm';
import * as supertest from 'supertest';
import * as chai from 'chai';
import * as _ from 'lodash';

import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';
import { cookieForUser } from './helpers';
import { UserRole } from '../app/models/User';
import { UserSeeding } from '../app/seeding';

const server: ServerService = new ServerService();
let agent: any;

const connectionManager: EntityManager = getManager();

describe.only('user', () => {
    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('GET - /users/lookup - Performing username based like lookup', () => {
        it('Should reject not authenticated.', async () => {
            await agent.get('/users/lookup?username=test').expect(401);
        });

        it('Should reject not a minimum level of moderator.', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();

            await agent
                .get('/users/lookup?username=test')
                .set('Cookie', await cookieForUser(user))
                .send()
                .expect(403);
        });
    });
});
