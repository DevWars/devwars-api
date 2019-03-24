import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import {CompetitorFactory, UserFactory} from '../app/factory';
import {Server} from '../config/Server';

import {CompetitorRepository} from '../app/repository';
import {cookieForUser} from './helpers';

const server: Server = new Server();
let app: express.Application;

describe('competitor', () => {
    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    it('should return competitor data from user id', async () => {
        const user = await UserFactory.default().save();
        await CompetitorFactory.withUser(user).save();

        const response = await supertest(app)
            .get(`/user/${user.id}/competitor`)
            .set('cookie', await cookieForUser(user))
            .send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an('object');
    });

    it('should save a competitor after registering', async () => {
        const user = await UserFactory.default().save();
        const competitor = CompetitorFactory.default();

        const response = await supertest(app)
            .post(`/user/${user.id}/competitor`)
            .set('cookie', await cookieForUser(user))
            .send(competitor);

        console.log(response.body);
        chai.expect(response.status).to.be.eq(200);

        const found = CompetitorRepository.forUser(user);

        chai.expect(found).not.to.be.null;
    });
});
