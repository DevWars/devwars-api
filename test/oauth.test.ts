import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import { Server } from '../config/Server';

import { UserFactory } from '../app/factory'
import { cookieForUser } from './helpers';

import './setup';
import User from '../app/models/User';

const server: Server = new Server();
let app: express.Application;

describe('oauth', () => {
    beforeEach(async () => {
        await server.Start();
        app = server.App();
    });

    it('GET - auth/user - should retrieve the currrent user information', async () => {
        const user = await UserFactory.default().save();

        const request = await supertest(app)
            .get('/auth/user')
            .set('Cookie', await cookieForUser(user))
            .send();

        chai.expect(request.body.id).to.be.eq(user.id);
    })

    it('GET - auth/user - should retrieve 404 because user doesnt exist', async () => {
        const user = await UserFactory.default().save();

        const request = await supertest(app)
            .get('/auth/user')
            .set('Cookie', 'oauth=asdasdad')
            .send();

        chai.expect(request.status).to.be.eq(404);
    })

    it('POST - auth/login - the login should faild because user doesnt exist ', async () => {
        const user = await UserFactory.default().save();

        const request = await supertest(app)
            .post('/auth/login')
            .send({
                identifier: user.username + "test",
                password: ""
            });

        chai.expect(request.status).to.be.eq(400);
    })

    it('POST - auth/login - the login should faild because password is not good', async () => {
        const user = await UserFactory.default().save();

        const request = await supertest(app)
            .post('/auth/login')
            .send({
                identifier: user.username,
                password: "dddd"
            });

        chai.expect(request.status).to.be.eq(400);
    })

    it('POST - auth/login - the login should return user', async () => {
        const user = await UserFactory.default().save();

        const request = await supertest(app)
            .post('/auth/login')
            .send({
                identifier: user.username,
                password: "secret"
            });

        chai.expect(request.body.id).to.be.eq(user.id);
    })

    it('POST - auth/logout - the logout should not work because no token', async () => {
        const user = await UserFactory.default().save();

        const request = await supertest(app)
            .post('/auth/logout')
            .send();

        chai.expect(request.status).to.be.eq(500);
    })

    it('POST - auth/logout - the logout should not work invalid token', async () => {
        const user = await UserFactory.default().save();

        const request = await supertest(app)
            .post('/auth/logout')
            .set('Cookie', 'auth="skdja"')
            .send();

        chai.expect(request.status).to.be.eq(500);
    })

    it('POST - auth/logout - the logout should work', async () => {
        const user = await UserFactory.default().save();

        const request = await supertest(app)
            .post('/auth/logout')
            .set('Cookie', await cookieForUser(user))
            .send();

        chai.expect(request.status).to.be.eq(200);

        const afterUser = await User.findOne(user.id);

        chai.expect(afterUser.token).to.be.eq(null);
    })


    it('POST - auth/register - should return the new user created', async () => {
        const request = await supertest(app)
            .post('/auth/register')
            .send({
                username: "asdad",
                email: "email@email.fr",
                password: "secret"
            });

        chai.expect(request.status).to.be.eq(200);
        chai.expect(request.body.email).to.be.eq("email@email.fr");
    })
})