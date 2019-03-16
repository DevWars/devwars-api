import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';

import {Server} from '../config/Server';

import {UserFactory} from '../app/factory';
import {PasswordReset, User} from '../app/models';

const server: Server = new Server();
let app: express.Application;

describe('reset-password', () => {

    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    it('should be able to initiate from username', async () => {
        const user = await UserFactory.default().save();

        const response = await supertest(app)
            .post('/auth/reset')
            .send({username_or_email: user.username});

        chai.expect(response.status).to.be.eq(200);

        const reset = PasswordReset.find({where: {user}});

        chai.expect(reset).not.to.be.null;
    });

    it('should be able to initiate from email', async () => {
        const user = await UserFactory.default().save();

        const response = await supertest(app)
            .post('/auth/reset')
            .send({username_or_email: user.email});

        chai.expect(response.status).to.be.eq(200);

        const reset = PasswordReset.find({where: {user}});

        chai.expect(reset).not.to.be.null;
    });

    it('should be able to reset password with token', async () => {
        const user = await UserFactory.default().save();
        const reset = await new PasswordReset(user).save();

        const oldHash = user.password;

        const response = await supertest(app)
            .put('/auth/reset')
            .query({key: reset.token, password: 'newpassword'})
            .send();

        const newHash = (await User.findOne(user.id)).password;

        chai.expect(response.status).to.be.eq(200);
        chai.expect(oldHash).not.to.be.eq(newHash);
    });
});
