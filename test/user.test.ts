import { getManager, EntityManager, getCustomRepository } from 'typeorm';
import * as supertest from 'supertest';
import * as chai from 'chai';
import * as _ from 'lodash';

import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';
import { cookieForUser } from './helpers';
import User, { UserRole } from '../app/models/User';
import { UserSeeding } from '../app/seeding';
import { COMPETITOR_USERNAME } from '../app/constants';
import UserProfile from '../app/models/UserProfile';
import UserStats from '../app/models/UserStats';
import UserGameStats from '../app/models/UserGameStats';
import LinkedAccount from '../app/models/LinkedAccount';
import EmailVerification from '../app/models/EmailVerification';
import PasswordReset from '../app/models/PasswordReset';

const server: ServerService = new ServerService();
let agent: any;

describe('user', () => {
    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('GET - /users/lookup?username=:username&limit=:limit - Performing username based like lookup', () => {
        const lookupUrl = '/users/lookup?username=testing&limit=3';
        let moderator: User = null;

        beforeEach(async () => {
            moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();
        });

        it('Should reject not authenticated users.', async () => {
            await agent.get(lookupUrl).expect(401);
        });

        it('Should reject users not a minimum role of moderator.', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();

            await agent
                .get(lookupUrl)
                .set('Cookie', await cookieForUser(user))
                .send()
                .expect(403);
        });

        it('Should allow moderator and admins.', async () => {
            const admin = await UserSeeding.withRole(UserRole.ADMIN).save();

            for (const test of [
                [moderator, 200],
                [admin, 200],
            ]) {
                await agent
                    .get(lookupUrl)
                    .set('Cookie', await cookieForUser(test[0] as User))
                    .send()
                    .expect(test[1]);
            }
        });

        it('Should reject if the given username is not provided', async () => {
            await agent
                .get('/users/lookup')
                .set('Cookie', await cookieForUser(moderator))
                .send()
                .expect(400, {
                    error: 'The specified username within the query must not be empty.',
                });
        });

        it('Should respect the limit if specified', async () => {
            for (const test of [
                [50, 50],
                [1, 1],
                [10, 10],
                [500, 50],
            ]) {
                const response = await agent
                    .get(`/users/lookup?username=e&limit=${test[0]}`)
                    .set('Cookie', await cookieForUser(moderator))
                    .send();

                // less than or equal since user generation is not as expected and the results could
                // diff based on seeding.
                chai.expect(response.body.length <= test[1]).to.be.eq(true);
            }
        });

        it("Should return related users when looking up 'testing'", async () => {
            const users = ['one', 'two', 'three'];

            for (const user of users) {
                await UserSeeding.withUsername(`testing-${user}`).save();
            }

            const response = await agent
                .get(lookupUrl)
                .set('Cookie', await cookieForUser(moderator))
                .send();

            chai.expect(response.body.length).to.be.eq(3);

            for (const user of response.body) {
                chai.expect(users).to.include(user.username.split('-')[1]);
                chai.expect(user.id).to.not.eq(undefined);
                chai.expect(user.id).to.not.eq(null);
            }
        });
    });

    describe('DELETE /users/{{userId}} - Performing a delete request for the specified user', () => {
        let administrator: User;
        let competitor: User;
        let moderator: User;
        let tempUser: User;

        before(async () => {
            // ensuring that the constant user exists before running the test since its required for
            // performing a correct deletion.
            competitor = await UserSeeding.withUsername(COMPETITOR_USERNAME).save();
            administrator = await UserSeeding.withRole(UserRole.ADMIN).save();
            moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();
        });

        beforeEach(async () => {
            tempUser = await UserSeeding.withRole(UserRole.USER).save();
        });

        it('Should fail deleting the user if you are not authenticated.', async () => {
            await agent.delete(`/users/${tempUser.id}`).expect(401);
        });

        it('Should fail deleting the user if you are a moderator.', async () => {
            const result = await agent
                .delete(`/users/${tempUser.id}`)
                .set('Cookie', await cookieForUser(moderator))
                .expect(403);
        });

        it('Should fail deleting the user if you are a standard user and not the owner.', async () => {
            await agent
                .delete(`/users/${moderator.id}`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(403);
        });

        it('Should allow deleting the user if you are the owner', async () => {
            await agent
                .delete(`/users/${tempUser.id}`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(200, { user: tempUser.id });
        });

        it('Should allow deleting the user if you are the a administrator', async () => {
            await agent
                .delete(`/users/${tempUser.id}`)
                .set('Cookie', await cookieForUser(administrator))
                .expect(200, { user: tempUser.id });
        });

        it('Should remove the users profile.', async () => {
            const userProfile = await new UserProfile(tempUser).save();

            chai.expect(_.isNil(await UserProfile.findOne({ where: { user: tempUser } }))).to.eq(false);

            await agent
                .delete(`/users/${tempUser.id}`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(200, { user: tempUser.id });

            // After deletion of the user, ensure that the profile has gone as well.
            chai.expect(_.isNil(await UserProfile.findOne({ where: { user: tempUser } }))).to.eq(true);
            chai.expect(_.isNil(await UserProfile.findOne(userProfile.id))).to.eq(true);
        });

        it('Should remove the users statistics.', async () => {
            const userStats = await new UserStats(tempUser).save();

            chai.expect(_.isNil(await UserStats.findOne({ where: { user: tempUser } }))).to.eq(false);

            await agent
                .delete(`/users/${tempUser.id}`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(200, { user: tempUser.id });

            // After deletion of the user, ensure that the profile has gone as well.
            chai.expect(_.isNil(await UserStats.findOne({ where: { user: tempUser } }))).to.eq(true);
            chai.expect(_.isNil(await UserStats.findOne(userStats.id))).to.eq(true);
        });

        it('Should remove the users game statistics.', async () => {
            const userGameStats = await new UserGameStats(tempUser).save();

            chai.expect(_.isNil(await UserGameStats.findOne({ where: { user: tempUser } }))).to.eq(false);

            await agent
                .delete(`/users/${tempUser.id}`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(200, { user: tempUser.id });

            // After deletion of the user, ensure that the profile has gone as well.
            chai.expect(_.isNil(await UserGameStats.findOne({ where: { user: tempUser } }))).to.eq(true);
            chai.expect(_.isNil(await UserGameStats.findOne(userGameStats.id))).to.eq(true);
        });

        it('Should remove the users email verification if any.', async () => {
            const emailVerification = new EmailVerification();
            emailVerification.token = tempUser.username + tempUser.id;
            emailVerification.user = tempUser;

            await emailVerification.save();

            chai.expect(_.isNil(await EmailVerification.findOne({ where: { user: tempUser } }))).to.eq(false);

            await agent
                .delete(`/users/${tempUser.id}`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(200, { user: tempUser.id });

            // After deletion of the user, ensure that the profile has gone as well.
            chai.expect(_.isNil(await EmailVerification.findOne({ where: { user: tempUser } }))).to.eq(true);
            chai.expect(_.isNil(await EmailVerification.findOne(emailVerification.id))).to.eq(true);
        });

        it('Should remove the users password reset if any.', async () => {
            const passwordReset = new PasswordReset();
            passwordReset.token = tempUser.username + tempUser.id;
            passwordReset.expiresAt = new Date();
            passwordReset.user = tempUser;

            await passwordReset.save();

            chai.expect(_.isNil(await PasswordReset.findOne({ where: { user: tempUser } }))).to.eq(false);

            await agent
                .delete(`/users/${tempUser.id}`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(200, { user: tempUser.id });

            // After deletion of the user, ensure that the profile has gone as well.
            chai.expect(_.isNil(await PasswordReset.findOne({ where: { user: tempUser } }))).to.eq(true);
            chai.expect(_.isNil(await PasswordReset.findOne(passwordReset.id))).to.eq(true);
        });

        it('Should remove all the users linked accounts if any.', async () => {
            const { username, id } = tempUser;

            await new LinkedAccount(tempUser, username, username + id, `${id}`).save();
            await new LinkedAccount(tempUser, username + 1, username + id + 1, `${id}1`).save();

            const linkedAccounts = await LinkedAccount.find({ where: { user: tempUser } });
            chai.expect(linkedAccounts.length).to.eq(2);

            await agent
                .delete(`/users/${tempUser.id}`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(200, { user: tempUser.id });

            const updatedLinkedAccounts = await LinkedAccount.find({ where: { user: tempUser } });
            chai.expect(updatedLinkedAccounts.length).to.eq(0);
        });

        it.skip('Should remove all the users activities if any.', async () => {});

        it.skip('Should remove all the users future game applications if any.', async () => {});

        it.skip('Should replace all previous game applications with replacement competitor user if any.', async () => {});
    });
});
