import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';

import { Server } from '../config/Server';

import { IProfileRequest } from '../app/request/IProfileRequest';

import { cookieForUser } from './helpers';
import { UserFactory, UserProfileFactory } from '../app/factory';

import UserProfile from '../app/models/UserProfile';
import { UserRole } from '../app/models/User';

import { ObjectEqual } from '../app/utils/compare';

import './setup';

const server: Server = new Server();
let app: express.Application;

const settings: any | IProfileRequest = {
    firstName: 'damien',
    lastName: 'test',
    dob: new Date(),
    about: 'i am the about me',
    forHire: true,
    company: 'Big one',
    websiteUrl: 'https://google.com',
    addressOne: 'address one line',
    addressTwo: 'address two line',
    city: 'Big City',
    state: 'USA',
    zip: '595959',
    country: 'France',
    skills: {
        html: 0,
        css: 3,
        js: 2,
    },
};

describe('user-profile', () => {
    beforeEach(async () => {
        await server.Start();
        app = server.App();
    });

    it("PATCH - /users/:userId/profile - should update a user's settings", async () => {
        const user = await UserFactory.default().save();
        await UserProfileFactory.withUser(user).save();

        const response = await supertest(app)
            .patch(`/users/${user.id}/profile`)
            .set('cookie', await cookieForUser(user))
            .send(settings);

        chai.expect(response.status).to.be.eq(200);

        const data: any = await UserProfile.findOne({
            where: {
                user: user.id
            }
        });
        let diff = false;

        Object.keys(settings).map(k => {
            if (k === 'skills') {
                if (ObjectEqual(data[k], settings[k]) === false) diff = true
            } else if (k === 'dob') {
                if ((new Date(data[k]).getTime() === new Date(settings[k]).getTime()) !== true) diff = true;
            } else if (data[k] !== settings[k]) {
                diff = true;
            }
        })

        chai.expect(diff).to.be.eq(false);
    });

    it("PATCH - /users/:userId/profile - mod should not update another user profile", async () => {
        const user = await UserFactory.withRole(UserRole.USER).save();
        const modo = await UserFactory.withRole(UserRole.MODERATOR).save();

        const response = await supertest(app)
            .patch(`/users/${user.id}/profile`)
            .set('cookie', await cookieForUser(modo))
            .send(settings);

        chai.expect(response.status).to.be.eq(401);
    });

    it("PATCH - /users/:userId/profile - mod should not update another user profile", async () => {
        const user = await UserFactory.withRole(UserRole.USER).save();
        await UserProfileFactory.withUser(user).save();
        const admin = await UserFactory.withRole(UserRole.ADMIN).save();

        const response = await supertest(app)
            .patch(`/users/${user.id}/profile`)
            .set('cookie', await cookieForUser(admin))
            .send(settings);

        chai.expect(response.status).to.be.eq(200);
    });
});
