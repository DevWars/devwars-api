import { getManager, EntityManager, getCustomRepository } from 'typeorm';
import * as supertest from 'supertest';
import * as chai from 'chai';
import * as _ from 'lodash';
import { addHours } from 'date-fns';

import { UserSeeding, EmailVerificationSeeding } from '../app/seeding';
import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';
import { cookieForUser } from './helpers';

import EmailVerification from '../app/models/EmailVerification';
import PasswordReset from '../app/models/PasswordReset';
import User, { UserRole } from '../app/models/User';

import PasswordResetRepository from '../app/repository/PasswordReset.repository';
import UserRepository from '../app/repository/User.repository';

const server: ServerService = new ServerService();
let agent: any;

// used for the creation of the database transactions without the need of constantly calling into
// get manager everytime a test needs a transaction.
const connectionManager: EntityManager = getManager();

describe('Authentication', () => {
    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('GET - /auth/user - Gathering Authenticated User', () => {
        it('Should retrieve the current user information', async () => {
            const user = await UserSeeding.default().save();

            const request = await agent
                .get('/auth/user')
                .set('Cookie', await cookieForUser(user))
                .send();

            chai.expect(request.body.id).to.be.eq(user.id);

            chai.expect(!request.body.password).to.equal(true);
            chai.expect(!request.body.token).to.equal(true);
        });

        it('Should retrieve 401 because user does not exist / not authorized', async () => {
            await UserSeeding.default().save();

            const request = await agent
                .get('/auth/user')
                .set('Cookie', 'token=test')
                .send();

            chai.expect(request.status).to.be.eq(401);
        });
    });

    describe('POST - /auth/login - Authenticating with the system', () => {
        it('Should failed because user does not exist ', async () => {
            const user = await UserSeeding.default().save();

            const request = await agent.post('/auth/login').send({
                identifier: user.username + 'test',
                password: '',
            });

            chai.expect(request.status).to.be.eq(400);
        });

        it('Should failed because password is not good', async () => {
            const user = await UserSeeding.default().save();

            const request = await agent.post('/auth/login').send({
                identifier: user.username,
                password: 'dddd',
            });

            chai.expect(request.status).to.be.eq(400);
        });

        it('Should return user with valid login', async () => {
            const user = await UserSeeding.default().save();

            const request = await agent.post('/auth/login').send({
                identifier: user.username,
                password: 'secret',
            });

            chai.expect(request.body.id).to.be.eq(user.id);

            chai.expect(!request.body.password).to.equal(true);
            chai.expect(!request.body.token).to.equal(true);
        });
    });

    describe('POST - /auth/logout - Logging out of the system', () => {
        it('Should not work because no token', async () => {
            await UserSeeding.default().save();

            await agent
                .post('/auth/logout')
                .send()
                .expect(401);
        });

        it('Should not work invalid token', async () => {
            await UserSeeding.default().save();

            await agent
                .post('/auth/logout')
                .set('Cookie', 'token=test')
                .expect(401);
        });

        it('Should logout correctly with valid login', async () => {
            const user = await UserSeeding.default().save();

            const loginRequest = await agent.post('/auth/login').send({
                identifier: user.username,
                password: 'secret',
            });

            const request = await agent
                .post('/auth/logout')
                .set('Cookie', loginRequest)
                .send();

            chai.expect(request.status).to.be.eq(200);

            const afterUser = await User.findOne(user.id);
            chai.expect(afterUser.token).to.be.eq(null);
        });
    });

    describe('POST - /auth/register - Registration with the system', () => {
        it('Should return the new user created', async () => {
            const request = await agent.post('/auth/register').send({
                username: 'test_user',
                email: 'email@email.fr',
                password: 'secretpassword',
            });

            chai.expect(request.status).to.be.eq(200);
            chai.expect(request.body.email).to.be.eq('email@email.fr');

            chai.expect(!request.body.password).to.equal(true);
            chai.expect(!request.body.token).to.equal(true);
        });
    });

    describe('POST - /auth/verify - Verifying emails with the system', () => {
        it('Should find the token and delete it', async () => {
            const user = UserSeeding.withRole(UserRole.USER);
            const emailVerification = EmailVerificationSeeding.withUser(user);

            await connectionManager.transaction(async (transaction) => {
                await transaction.save(user);
                await transaction.save(emailVerification);
            });

            // Validating that the token actually exists before attempting to verify removing the chance
            // of having false positives.
            const preVerifyToken = await EmailVerification.findOne({
                where: { token: emailVerification.token },
                relations: ['user'],
            });

            chai.should().exist(preVerifyToken);
            chai.expect(preVerifyToken.user.id).to.be.eq(user.id);
            chai.expect(preVerifyToken.token).to.eq(emailVerification.token);

            await agent.get(`/auth/verify?token=${emailVerification.token}`).send();

            const checkVerifyTokenDelete = await EmailVerification.findOne({
                where: { token: emailVerification.token },
            });

            chai.should().not.exist(checkVerifyTokenDelete);
        });
    });

    describe('POST - /auth/forgot/password - Requesting a password reset.', () => {
        const forgotPasswordRoute = '/auth/forgot/password';

        it('Should reject the request if the username does not meet requirements', async () => {
            await agent
                .post(forgotPasswordRoute)
                .send({ username_or_email: 'bad' })
                .expect(400);
        });

        it('Should reject the request if the email does not meet requirements', async () => {
            await agent
                .post(forgotPasswordRoute)
                .send({ username_or_email: 'bad@' })
                .expect(400);
        });

        it('Should reject the request if the user does not exist by username', async () => {
            await agent
                .post(forgotPasswordRoute)
                .send({ username_or_email: 'userdoesnotexist' })
                .expect(404, { error: 'User not found.' });
        });

        it('Should reject the request if the user does not exist by email', async () => {
            await agent
                .post(forgotPasswordRoute)
                .send({ username_or_email: 'userdoesnotexist@emailnotexisting.com' })
                .expect(404, { error: 'User not found.' });
        });

        it('Should respond if the user does exist by email', async () => {
            const user = await UserSeeding.default().save();

            await agent
                .post(forgotPasswordRoute)
                .send({ username_or_email: user.email })
                .expect(200, { message: 'Reset password, check your email.' });
        });

        it('Should respond if the user does exist by username', async () => {
            const user = await UserSeeding.default().save();

            await agent
                .post(forgotPasswordRoute)
                .send({ username_or_email: user.username })
                .expect(200, { message: 'Reset password, check your email.' });
        });

        it('Should write away reset token after emailing', async () => {
            const user = await UserSeeding.default().save();

            await agent
                .post(forgotPasswordRoute)
                .send({ username_or_email: user.username })
                .expect(200, { message: 'Reset password, check your email.' });

            const passwordRepository = getCustomRepository(PasswordResetRepository);
            const password = await passwordRepository.findOne({ where: { user } });

            chai.expect(!_.isNil(password)).to.equal(true);
            chai.expect(!_.isNil(password.token)).to.equal(true);
        });
    });

    describe('POST - /auth/reset/password - Resetting a password.', () => {
        const resetPasswordRoute = '/auth/reset/password';

        it('Should reject when the token is not provided in the query', async () => {
            await agent.post(`${resetPasswordRoute}?token=&password=password`).expect(400);
        });

        it('Should reject if the new password is not provided in the query', async () => {
            await agent.post(`${resetPasswordRoute}?token=token&password=`).expect(400);
        });

        it('Should reject if the new password is not valid to the systems specification', async () => {
            await agent.post(`${resetPasswordRoute}?token=token&password=bad`).expect(400);
        });

        it('Should reject if the password reset does not exist by the token', async () => {
            await agent
                .post(`${resetPasswordRoute}?token=notexist&password=goodpassword`)
                .expect(400, { error: 'Could not reset password' });
        });

        it('Should reject if the password reset expired', async () => {
            const user = await UserSeeding.default().save();
            const updatedPasswordReset = new PasswordReset(user, 'tokenupdated', addHours(new Date(), -1));
            await updatedPasswordReset.save();

            await agent
                .post(`${resetPasswordRoute}?token=tokenupdated&password=goodpassword`)
                .expect(401, { error: 'Expired password reset token' });
        });

        it('Should be accepted if all parameters are valid and the token is not expired.', async () => {
            const newUser = await UserSeeding.default().save();
            const updatedPasswordReset = new PasswordReset(newUser, 'thetoken', addHours(new Date(), 1));
            await updatedPasswordReset.save();

            await agent
                .post(`${resetPasswordRoute}?token=thetoken&password=updatedpassword`)
                .send()
                .expect(200, { message: 'Password reset!' });

            const userRepository = getCustomRepository(UserRepository);
            const updatedUser = await userRepository.findById(newUser.id);

            chai.expect(_.isNil(updatedUser)).not.equal(true);
            chai.expect(updatedUser.password).not.equal(newUser.password);

            await agent
                .post('/auth/login')
                .send({ identifier: newUser.username, password: 'updatedpassword' })
                .expect(200, {
                    id: newUser.id,
                    email: newUser.email,
                    username: newUser.username,
                    role: newUser.role,
                    avatarUrl: newUser.avatarUrl,
                });
        });
    });

    describe('POST - /auth/reset/email - Resetting a email.', () => {
        const resetEmailRoute = '/auth/reset/email';
        let token: string;
        let user: User;

        beforeEach(async () => {
            user = await UserSeeding.default().save();
            token = await cookieForUser(user);
        });

        it('Should reject when the password is not in the body', async () => {
            await agent
                .post(resetEmailRoute)
                .set('Cookie', token)
                .send({ email: 'updated@example.com' })
                .expect(400);
        });

        it('Should reject when the email is not in the body', async () => {
            await agent
                .post(resetEmailRoute)
                .set('Cookie', token)
                .send({ password: 'secret' })
                .expect(400);
        });

        it('Should reject if the new email address is not a valid email', async () => {
            await agent
                .post(resetEmailRoute)
                .set('Cookie', token)
                .send({ password: 'secret', email: 'invalidemail@sample' })
                .expect(400);
        });

        it('Should reject if the user is not authenticated', async () => {
            await agent
                .post(resetEmailRoute)
                .send({ password: 'secret', email: 'valid@sample.com' })
                .expect(401);
        });

        it('Should reject if the password is invalid', async () => {
            await agent
                .post(resetEmailRoute)
                .set('Cookie', token)
                .send({ password: 'secret1', email: 'valid@sample.com' })
                .expect(400, { error: 'Password did not match.' });
        });

        it('Should accept a valid updated email address.', async () => {
            await agent
                .post(resetEmailRoute)
                .set('Cookie', token)
                .send({ password: 'secret', email: 'valid@sample.com' })
                .expect(200, { message: 'Email reset.' });

            const userRepository = getCustomRepository(UserRepository);
            const updatedUser = await userRepository.findById(user.id);

            chai.expect(_.isNil(updatedUser)).not.equal(true);
            chai.expect(updatedUser.email).not.equal(user.password);
            chai.expect(updatedUser.email).equal('valid@sample.com');
        });
    });
});
