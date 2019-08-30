import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import { getManager, EntityManager } from 'typeorm';

import { Server } from '../config/Server';
import { UserFactory, EmailVerificationFactory } from '../app/factory';
import { cookieForUser } from './helpers';

import User, { UserRole } from '../app/models/User';
import EmailVerification from '../app/models/EmailVerification';
import './setup';

const server: Server = new Server();
let app: express.Application;

// used for the creation of the database transactions without the need of constantly calling into
// get manager everytime a test needs a transaction.
const connectionManager: EntityManager = getManager();

describe('oauth', () => {
    before(async () => {
        await server.Start();
        app = server.App();
    });

    it('GET - auth/user - should retrieve the current user information', async () => {
        const user = await UserFactory.default().save();

        const request = await supertest(app)
            .get('/auth/user')
            .set('Cookie', await cookieForUser(user))
            .send();

        chai.expect(request.body.id).to.be.eq(user.id);
    });

    it('GET - auth/user - should retrieve 404 because user does not exist', async () => {
        await UserFactory.default().save();

        const request = await supertest(app)
            .get('/auth/user')
            .set('Cookie', 'oauth=test')
            .send();

        chai.expect(request.status).to.be.eq(404);
    });

    it('POST - auth/login - the login should failed because user does not exist ', async () => {
        const user = await UserFactory.default().save();

        const request = await supertest(app)
            .post('/auth/login')
            .send({
                identifier: user.username + 'test',
                password: '',
            });

        chai.expect(request.status).to.be.eq(400);
    });

    it('POST - auth/login - the login should failed because password is not good', async () => {
        const user = await UserFactory.default().save();

        const request = await supertest(app)
            .post('/auth/login')
            .send({
                identifier: user.username,
                password: 'dddd',
            });

        chai.expect(request.status).to.be.eq(400);
    });

    it('POST - auth/login - the login should return user', async () => {
        const user = await UserFactory.default().save();

        const request = await supertest(app)
            .post('/auth/login')
            .send({
                identifier: user.username,
                password: 'secret',
            });

        chai.expect(request.body.id).to.be.eq(user.id);
    });

    it('POST - auth/logout - the logout should not work because no token', async () => {
        await UserFactory.default().save();

        const request = await supertest(app)
            .post('/auth/logout')
            .send();

        chai.expect(request.status).to.be.eq(500);
    });

    it('POST - auth/logout - the logout should not work invalid token', async () => {
        await UserFactory.default().save();

        const request = await supertest(app)
            .post('/auth/logout')
            .set('Cookie', 'auth=test')
            .send();

        chai.expect(request.status).to.be.eq(500);
    });

    it('POST - auth/logout - the logout should work', async () => {
        const user = await UserFactory.default().save();

        const request = await supertest(app)
            .post('/auth/logout')
            .set('Cookie', await cookieForUser(user))
            .send();

        chai.expect(request.status).to.be.eq(200);

        const afterUser = await User.findOne(user.id);

        chai.expect(afterUser.token).to.be.eq(null);
    });

    it('POST - auth/register - should return the new user created', async () => {
        const request = await supertest(app)
            .post('/auth/register')
            .send({
                username: 'test',
                email: 'email@email.fr',
                password: 'secret',
            });

        chai.expect(request.status).to.be.eq(200);
        chai.expect(request.body.email).to.be.eq('email@email.fr');
    });

    it('GET - auth/verify - it should find the token and delete it', async () => {
        const user = UserFactory.withRole(UserRole.USER);
        const emailVerification = EmailVerificationFactory.withUser(user);

        await connectionManager.transaction(async (transaction) => {
            await transaction.save(user);
            await transaction.save(emailVerification);
        });

        // validating that the token actually exists before attempting to verify
        // removing the chance of having false positives.
        const preVerifyToken = await EmailVerification.findOne({
            where: { token: emailVerification.token },
            relations: ['user'],
        });

        chai.should().exist(preVerifyToken);
        chai.expect(preVerifyToken.user.id).to.be.eq(user.id);
        chai.expect(preVerifyToken.token).to.eq(emailVerification.token);

        await supertest(app)
            .get(`/auth/verify?token=${emailVerification.token}`)
            .send();

        const checkVerifyTokenDelete = await EmailVerification.findOne({
            where: { token: emailVerification.token },
        });

        chai.should().not.exist(checkVerifyTokenDelete);
    });
});
