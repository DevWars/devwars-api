import { EntityManager, getManager } from 'typeorm';
import * as supertest from 'supertest';
import { SuperTest, Test } from 'supertest';
import * as chai from 'chai';
import * as _ from 'lodash';

import { UserProfileSeeding, UserSeeding } from '../app/seeding';
import { ProfileRequest } from '../app/request/profileRequest';
import { Connection } from '../app/services/connection.service';
import ServerService from '../app/services/server.service';
import { cookieForUser } from './helpers';

import UserProfile, { Sex } from '../app/models/userProfile.model';
import User, { UserRole } from '../app/models/user.model';

const server: ServerService = new ServerService();
let agent: SuperTest<Test>;

// used for the creation of the database transactions without the need of constantly calling into
// get manager everytime a test needs a transaction.
const connectionManager: EntityManager = getManager();

const userProfileSettings: ProfileRequest | any = {
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

    describe('GET - /users/:id/profile - Gather the users profile', () => {
        it('Should return the users profile if the authenticated user', async () => {
            const response = await agent
                .get(`/users/${user.id}/profile`)
                .set('cookie', await cookieForUser(user))
                .send();

            delete userProfile.user;

            const profile = userProfile as any;

            for (const dateVal of ['dob', 'createdAt', 'updatedAt']) {
                delete profile[dateVal];
                delete response.body[dateVal];
            }

            chai.expect(response.status).to.be.equal(200);

            for (const key in profile) {
                if (response.body[key]) {
                    chai.expect(response.body[key]).to.be.deep.equal(profile[key]);
                }
            }
        });

        it('Should fail if you are not the owning user and not a admin or moderator', async () => {
            const notOwning = await UserSeeding.withRole(UserRole.USER).save();

            const response = await agent
                .get(`/users/${user.id}/profile`)
                .set('cookie', await cookieForUser(notOwning))
                .send();

            chai.expect(response.status).to.be.equal(403);
        });

        it('Should pass if you are not the owning user and a admin or moderator', async () => {
            for (const role of [UserRole.ADMIN, UserRole.MODERATOR]) {
                const notOwning = await UserSeeding.withRole(role).save();

                const response = await agent
                    .get(`/users/${user.id}/profile`)
                    .set('cookie', await cookieForUser(notOwning))
                    .send();

                chai.expect(response.status).to.be.equal(200);
            }
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

        it('Moderators should be able to update another user profile', async () => {
            const localUser = UserSeeding.withRole(UserRole.USER);
            const localUserProfile = UserProfileSeeding.withUser(localUser);
            const userModerator = UserSeeding.withRole(UserRole.ADMIN);

            await connectionManager.transaction(async (transaction) => {
                await transaction.save(localUser);
                await transaction.save(localUserProfile);
                await transaction.save(userModerator);
            });

            const response = await agent
                .patch(`/users/${localUser.id}/profile`)
                .set('cookie', await cookieForUser(userModerator))
                .send(userProfileSettings);

            chai.expect(response.status).to.be.equal(200);
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
