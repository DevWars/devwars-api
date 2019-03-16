import * as chai from 'chai';
import * as express from 'express';
import * as faker from 'faker';
import * as supertest from 'supertest';

import {Server} from '../config/Server';
import {cookieForUser} from './helpers';

import {UserFactory} from '../app/factory';
import {User, UserRole} from '../app/models';
import {UserRepository} from '../app/repository';
import {EmailVerificationRepository} from '../app/repository/EmailVerification.repository';
import {hash} from '../app/utils/hash';

const server: Server = new Server();
let app: express.Application;

let user: User;

describe('reset', () => {

    before(async () => {
        await server.Start();

        app = server.App();

        user = await UserFactory.default();
        user.role = UserRole.USER;
        user.password = await hash('secret');

        await user.save();
    });

    it('should create a new email verification upon email reset', async () => {
        const res = await supertest(app)
            .post(`/user/${user.id}/reset/email`)
            .set('cookie', await cookieForUser(user))
            .send({
                email: faker.internet.email(),
                password: 'secret',
            });

        chai.expect(res.status).to.be.eq(200);

        const verifications = await EmailVerificationRepository.forUser(user);

        chai.expect(verifications).to.have.lengthOf(1);
    });

    it('should reset the user role to pending upon email reset', async () => {
        const res = await supertest(app)
            .post(`/user/${user.id}/reset/email`)
            .set('cookie', await cookieForUser(user))
            .send({
                email: faker.internet.email(),
                password: 'secret',
            });

        chai.expect(res.status).to.be.eq(200);

        user = await UserRepository.byId(user.id);

        chai.expect(user.role).to.be.eq(UserRole.PENDING);
    });

    it('should change the password hash', async () => {
        const oldHash = user.password;

        const res = await supertest(app)
            .put(`/user/${user.id}/reset/password`)
            .set('cookie', await cookieForUser(user))
            .send({
                newPassword: 'secret2',
                oldPassword: 'secret',
            });

        chai.expect(res.status).to.be.eq(200);

        user = await UserRepository.byId(user.id);

        chai.expect(oldHash).not.to.be.eq(user.password);
    });
});
