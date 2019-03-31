import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';

import {Server} from '../config/Server';

import {ActivityFactory, UserFactory} from '../app/factory';
import {cookieForUser} from './helpers';

const server: Server = new Server();
let app: express.Application;

describe('activity', () => {

    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    // Utilize UserFactory
    it('should return all activities from user id', async () => {
        const user = await UserFactory.default().save();
        await ActivityFactory.withUser(user).save();

        const response = await supertest(app)
            .get('/activity/mine')
            .set('Cookie', await cookieForUser(user))
            .send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an('array');
    });
});
