import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import {UserFactory} from '../app/factory';
import {LinkedAccount} from '../app/models';
import {Server} from '../config/Server';
import {cookieForUser} from './helpers';

const server: Server = new Server();
let app: express.Application;

describe('linked-accounts', () => {

    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    // Utilize UserFactory
    it("should return all of a user's linked accounts", async () => {
        const user = await UserFactory.default().save();
        const link = new LinkedAccount();
        link.user = user;
        link.username = user.username;
        link.provider = 'DISCORD';
        link.providerId = '1';

        await link.save();

        const response = await supertest(app).get(`/user/${user.id}/linked-accounts`)
            .set('cookie', await cookieForUser(user))
            .send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an('array');
        chai.expect(response.body).to.have.lengthOf(1);
    });
});
