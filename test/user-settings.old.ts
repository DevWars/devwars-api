import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';

import { Server } from '../config/Server';

import { ISettingsChangeRequest } from '../app/request/ISetttingsChangeRequest';
import { cookieForUser } from './helpers';

import { UserFactory } from '../app/factory';
import { User } from '../app/models';

const server: Server = new Server();
let app: express.Application;

describe('user-settings', () => {
    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    // Utilize UserFactory
    it("should update a user's settings", async () => {
        let user = await UserFactory.default().save();

        const settings: ISettingsChangeRequest = {
            about: 'Hello World',
            forHire: true,
            location: 'New York',
            username: 'Hello World',
            websiteUrl: 'http://google.com',
        };

        const response = await supertest(app)
            .post(`/user/${user.id}/settings`)
            .set('cookie', await cookieForUser(user))
            .send(settings);

        chai.expect(response.status).to.be.eq(200);

        user = await User.findOne(user.id);

        chai.expect(user.profile.about).to.be.eq(settings.about);
        chai.expect(user.profile.forHire).to.be.eq(settings.forHire);
        chai.expect(user.profile.location).to.be.eq(settings.location);
        chai.expect(user.profile.websiteUrl).to.be.eq(settings.websiteUrl);
        chai.expect(user.username).to.be.eq(settings.username);
    });
});
