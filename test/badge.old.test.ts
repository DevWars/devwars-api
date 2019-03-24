import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';

import { Server } from '../config/Server';

import {UserFactory} from '../app/factory';
import {ALL_BADGES} from '../app/models';

const server: Server = new Server();
let app: express.Application;

describe('badge', () => {

    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    it('should return all badge', async () => {
        const response = await supertest(app).get('/badge').send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an('array');
    });

    it("should return a user's badges", async () => {
        const user = await UserFactory.default().save();
        const badge = ALL_BADGES[0];

        badge.users = [user];
        await badge.save();
        await user.save();

        const response = await supertest(app).get(`/user/${user.id}/badges`).send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an('array').of.length(1);
    });
});
