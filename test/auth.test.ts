import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import {User, UserRole} from '../app/models';
import ILoginRequest from '../app/request/ILoginRequest';
import IRegistrationRequest from '../app/request/RegistrationRequest';
import {Server} from '../config/Server';

const server: Server = new Server();
let app: express.Application;

describe('auth', () => {
    const email = 'test@test.com';
    const username = 'testuser';
    const password = 'testpass';

    beforeEach(async () => {
        await server.Start();
        app = server.App();

        const data: IRegistrationRequest = {email, username, password};
        const response = await supertest(app).post('/auth/register').send(data);

        const cookie = response.header['set-cookie'];

        chai.expect(response.status).to.be.eq(200);
        chai.expect(cookie).to.be.an('array');
        chai.expect(cookie).to.have.lengthOf(1);
    });

    it('should record a user upon registration', async () => {
        const found = await User.findOne({where: {email}});

        chai.expect(found).not.to.be.null;
    });

    it('should record a pending user upon registration', async () => {
        const found = await User.findOne({where: {email}});

        chai.expect(found).not.to.be.null;
        chai.expect(found.role).to.be.eq(UserRole.PENDING);
    });

    it('can sign in with the users email', async () => {
        const data: ILoginRequest = {identifier: email, password};
        const response = await supertest(app).post('/auth/login').send(data);

        chai.expect(response.status).to.be.eq(200);
    });

    it("can sign in with the user's username", async () => {
        const data: ILoginRequest = {identifier: username, password};
        const response = await supertest(app).post('/auth/login').send(data);

        chai.expect(response.status).to.be.eq(200);
    });

    it('fails when the credentials are invalid', async () => {
        const data: ILoginRequest = {identifier: username, password: 'nottestpassword'};
        const response = await supertest(app).post('/auth/login').send(data);

        chai.expect(response.status).to.be.eq(400);
    });

    it('returns a cookie upon a successful sign in', async () => {
        const data: ILoginRequest = {identifier: username, password};
        const response = await supertest(app).post('/auth/login').send(data);

        const cookie = response.header['set-cookie'];

        chai.expect(response.status).to.be.eq(200);
        chai.expect(cookie).to.be.an('array');
        chai.expect(cookie).to.have.lengthOf(1);
    });

    it('can fetch the current user with an auth token', async () => {
        const data: ILoginRequest = {identifier: username, password};
        const response = await supertest(app).post('/auth/login').send(data);

        const cookie = response.header['set-cookie'];

        const userResponse = await supertest(app).get('/auth/user').set('Cookie', cookie[0]);
        const user = userResponse.body as User;

        chai.expect(user).not.to.be.null;
        chai.expect(user.username).to.be.eq(username);
    });
});
