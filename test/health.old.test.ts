import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import {Server} from '../config/Server';

const server: Server = new Server();
let app: express.Application;

describe('Health', () => {

    before(async () => {
        await server.Start();

        app = server.App();
    });

    it('should return healthy', async () => {
        const res = await supertest(app).get('/health').send();

        chai.expect(res.status).to.be.eq(200);
        chai.expect(res.body.status).to.be.eq('Healthy');
    });
});
