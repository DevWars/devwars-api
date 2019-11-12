import { EntityManager, getManager } from 'typeorm';
import * as supertest from 'supertest';
import * as chai from 'chai';
import * as _ from 'lodash';

import { UserSeeding, UserProfileSeeding } from '../app/seeding';
import { IProfileRequest } from '../app/request/IProfileRequest';
import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';
import { cookieForUser } from './helpers';

import UserProfile, { Sex } from '../app/models/UserProfile';
import User, { UserRole } from '../app/models/User';

const server: ServerService = new ServerService();
let agent: any;

// used for the creation of the database transactions without the need of constantly calling into
// get manager everytime a test needs a transaction.
const connectionManager: EntityManager = getManager();

const userProfileSettings: any | IProfileRequest = {
    firstName: 'damien',
    lastName: 'test',
    dob: new Date(),
    sex: Sex.MALE,
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
    let user: User;
    let userProfile: UserProfile;

    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(async () => {
        agent = supertest.agent(server.App());

        user = UserSeeding.default();
        userProfile = UserProfileSeeding.withUser(user);

        await connectionManager.transaction(async (transaction) => {
            await transaction.save(user);
            await transaction.save(userProfile);
        });
    });

    describe('PATCH - /users/:id/profile - Updating a users profile', () => {
        it('Should reject a sex update if its not a valid sex', async () => {
            const profileUpdate = { ...userProfileSettings };
            profileUpdate.sex = 'invalid-sex';

            await agent
                .patch(`/users/${user.id}/profile`)
                .set('cookie', await cookieForUser(user))
                .send(profileUpdate)
                .expect(400);
        });

        it('Should reject a dob update if its not a valid datetime', async () => {
            const profileUpdate = { ...userProfileSettings };
            profileUpdate.dob = 'not-a-date';

            await agent
                .patch(`/users/${user.id}/profile`)
                .set('cookie', await cookieForUser(user))
                .send(profileUpdate)
                .expect(400);
        });

        it('Should reject a skills update if its not a valid object', async () => {
            const profileUpdate = { ...userProfileSettings };
            profileUpdate.skills = 5;

            await agent
                .patch(`/users/${user.id}/profile`)
                .set('cookie', await cookieForUser(user))
                .send(profileUpdate)
                .expect(400);
        });

        it("Should update a user's settings", async () => {
            await agent
                .patch(`/users/${user.id}/profile`)
                .set('cookie', await cookieForUser(user))
                .send(userProfileSettings)
                .expect(200);

            const data: any = await UserProfile.findOne({ where: { user: user.id } });
            const filteredData = _.pick(data, Object.keys(userProfileSettings));

            // Perform a deep equal to directly compare the two objects and
            // all the objects nested levels until completion or invalid matching.
            chai.expect(filteredData).to.be.deep.equal(userProfileSettings);
        });

        it('Moderators should not update another user profile', async () => {
            const userModerator = UserSeeding.withRole(UserRole.MODERATOR);
            const localUser = UserSeeding.withRole(UserRole.USER);

            await connectionManager.transaction(async (transaction) => {
                await transaction.save(userModerator);
                await transaction.save(localUser);
            });

            await agent
                .patch(`/users/${localUser.id}/profile`)
                .set('cookie', await cookieForUser(userModerator))
                .send(userProfileSettings)
                .expect(401);
        });

        it('Administrators should be able to update another user profile', async () => {
            const localUser = UserSeeding.withRole(UserRole.USER);
            const localUserProfile = UserProfileSeeding.withUser(localUser);
            const userAdministrator = UserSeeding.withRole(UserRole.ADMIN);

            await connectionManager.transaction(async (transaction) => {
                await transaction.save(localUser);
                await transaction.save(localUserProfile);
                await transaction.save(userAdministrator);
            });

            await agent
                .patch(`/users/${localUser.id}/profile`)
                .set('cookie', await cookieForUser(userAdministrator))
                .send(userProfileSettings)
                .expect(200);
        });
    });
});
