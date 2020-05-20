import * as _ from 'lodash';
import * as chai from 'chai';
import * as supertest from 'supertest';
import { ActivitySeeding, GameApplicationSeeding, UserSeeding, GameSeeding } from '../app/seeding';
import { SuperTest, Test } from 'supertest';
import { addDays } from 'date-fns';

import { Connection } from '../app/services/connection.service';
import ServerService from '../app/services/server.service';
import { cookieForUser } from './helpers';

import EmailVerification from '../app/models/emailVerification.model';
import GameApplication from '../app/models/gameApplication.model';
import UserGameStats from '../app/models/userGameStats.model';
import LinkedAccount from '../app/models/linkedAccount.model';
import PasswordReset from '../app/models/passwordReset.model';
import UserProfile from '../app/models/userProfile.model';
import User, { UserRole } from '../app/models/user.model';
import UserStats from '../app/models/userStats.model';
import Activity from '../app/models/activity.model';
import { getCustomRepository } from 'typeorm';
import { USERNAME_CHANGE_MIN_DAYS } from '../app/constants';
import UserRepository from '../app/repository/user.repository';

const server: ServerService = new ServerService();
let agent: SuperTest<Test> = null;

describe('user', () => {
    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('DELETE - /users/{{userId}} - Performing a delete request for the specified user', () => {
        let administrator: User;
        let moderator: User;
        let tempUser: User;

        before(async () => {
            // ensuring that the constant user exists before running the test since its required for
            // performing a correct deletion.
            administrator = await UserSeeding.withRole(UserRole.ADMIN).save();
            moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();
        });

        beforeEach(async () => {
            tempUser = await UserSeeding.withRole(UserRole.USER).save();
        });

        it('Should fail deleting the user if you are not authenticated', async () => {
            await agent.delete(`/users/${tempUser.id}`).expect(401);
        });

        it('Should fail deleting the user if you are a moderator', async () => {
            await agent
                .delete(`/users/${tempUser.id}`)
                .set('Cookie', await cookieForUser(moderator))
                .expect(403);
        });

        it('Should fail deleting the user if you are a standard user and not the owner', async () => {
            await agent
                .delete(`/users/${moderator.id}`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(403);
        });

        it('Should fail if you attempt to delete a moderator or higher regardless of role', async () => {
            const e = 'Users with roles moderator or higher cannot be deleted, ensure to demote the user first.';

            await agent
                .delete(`/users/${moderator.id}`)
                .set('Cookie', await cookieForUser(administrator))
                .expect(400, { error: e });

            await agent
                .delete(`/users/${administrator.id}`)
                .set('Cookie', await cookieForUser(administrator))
                .expect(400, { error: e });

            await agent
                .delete(`/users/${tempUser.id}`)
                .set('Cookie', await cookieForUser(administrator))
                .expect(200, { user: tempUser.id });
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

        it('Should remove the users profile', async () => {
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

        it('Should remove the users statistics', async () => {
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

        it('Should remove the users game statistics', async () => {
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

        it('Should remove the users email verification if any', async () => {
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

        it('Should remove the users password reset if any', async () => {
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

        it('Should remove all the users linked accounts if any', async () => {
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

        it('Should remove all the users activities if any', async () => {
            await ActivitySeeding.withUser(tempUser).save();
            await ActivitySeeding.withUser(tempUser).save();

            const activities = await Activity.find({ where: { user: tempUser } });
            chai.expect(activities.length).to.eq(2);

            await agent
                .delete(`/users/${tempUser.id}`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(200, { user: tempUser.id });

            const updatedActivities = await Activity.find({ where: { user: tempUser } });
            chai.expect(updatedActivities.length).to.eq(0);
        });

        it('Should remove all the users game applications if any', async () => {
            const gameOne = await GameSeeding.default().save();
            const gameTwo = await GameSeeding.default().save();

            await GameApplicationSeeding.withGameAndUser(gameOne, tempUser).save();
            await GameApplicationSeeding.withGameAndUser(gameTwo, tempUser).save();

            const gameApplications = await GameApplication.find({ where: { user: tempUser } });
            chai.expect(gameApplications.length).to.eq(2);

            await agent
                .delete(`/users/${tempUser.id}`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(200, { user: tempUser.id });

            const updatedGameApplications = await GameApplication.find({ where: { user: tempUser } });
            chai.expect(updatedGameApplications.length).to.eq(0);
        });
    });

    describe('PUT - /users/{userId} - Update a given user by the provided id', async () => {
        it('Should update the username if the lastUsernameUpdatedAt is null or valid', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();

            await agent
                .put(`/users/${user.id}/`)
                .set('Cookie', await cookieForUser(user))
                .send({ username: `${user.username}1` })
                .expect(200);

            user.lastUsernameUpdateAt = addDays(new Date(), USERNAME_CHANGE_MIN_DAYS + 1);

            await agent
                .put(`/users/${user.id}/`)
                .set('Cookie', await cookieForUser(user))
                .send({ username: `${user.username}` });
        });

        it('Should not update the username if the lastUsernameUpdatedAt is not valid', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            user.lastUsernameUpdateAt = addDays(new Date(), -(USERNAME_CHANGE_MIN_DAYS - 1));
            const minDateRequired = addDays(user.lastUsernameUpdateAt, USERNAME_CHANGE_MIN_DAYS);

            await agent
                .put(`/users/${user.id}/`)
                .set('Cookie', await cookieForUser(user))
                .send({ username: `${user.username}1` })
                .expect(409, {
                    error: `You are not allowed to update your username until ${minDateRequired.toUTCString()}`,
                });
        });

        it('Should allow a admin or moderator to update the username regardless of last updated at.', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            let usernameExtra = 1;

            for (const role of [UserRole.MODERATOR, UserRole.ADMIN]) {
                const updatingUser = await UserSeeding.withRole(role).save();
                user.lastUsernameUpdateAt = addDays(new Date(), -(USERNAME_CHANGE_MIN_DAYS + 1));

                await agent
                    .put(`/users/${user.id}/`)
                    .set('Cookie', await cookieForUser(updatingUser))
                    .send({ username: `${user.username}${usernameExtra}` })
                    .expect(200);

                usernameExtra += 1;
            }
        });

        it('Should fail if you try to update your username to a already existing user', async () => {
            const user = await UserSeeding.withRole(UserRole.USER).save();
            const userTwo = await UserSeeding.withRole(UserRole.USER).save();

            await agent
                .put(`/users/${userTwo.id}/`)
                .set('Cookie', await cookieForUser(userTwo))
                .send({ username: user.username })
                .expect(409, { error: 'The provided username already exists for a registered user.' });

            await agent
                .put(`/users/${userTwo.id}/`)
                .set('Cookie', await cookieForUser(userTwo))
                .send({ username: `${user.username}1` })
                .expect(200);
        });

        it('Should only be able to ban if Administrator or Moderator', async () => {
            const standardUser = await UserSeeding.withRole(UserRole.USER).save();

            await agent
                .put(`/users/${standardUser.id}/`)
                .set('Cookie', await cookieForUser(standardUser))
                .send({ role: UserRole.BANNED })
                .expect(401, { error: `You are not authorized to change the users role to ${UserRole.BANNED}` });

            for (const role of [UserRole.MODERATOR, UserRole.ADMIN]) {
                const user = await UserSeeding.withRole(role).save();
                await agent
                    .put(`/users/${standardUser.id}/`)
                    .set('Cookie', await cookieForUser(user))
                    .send({ role: UserRole.USER })
                    .expect(200);

                await agent
                    .put(`/users/${standardUser.id}/`)
                    .set('Cookie', await cookieForUser(user))
                    .send({ role: UserRole.BANNED })
                    .expect(200);
            }

            const userRepository = getCustomRepository(UserRepository);
            const updatedUser = await userRepository.findById(standardUser.id);

            chai.expect(updatedUser.role).to.be.equal(UserRole.BANNED);
        });

        it('Should fail if you try to update your role to a higher role than your own', async () => {
            const standardUser = await UserSeeding.withRole(UserRole.USER).save();
            const moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();

            for (const role of [UserRole.MODERATOR, UserRole.ADMIN]) {
                await agent
                    .put(`/users/${standardUser.id}/`)
                    .set('Cookie', await cookieForUser(standardUser))
                    .send({ role })
                    .expect(401, { error: `You are not authorized to change the users role to ${role}` });
            }

            await agent
                .put(`/users/${moderator.id}/`)
                .set('Cookie', await cookieForUser(moderator))
                .send({ role: UserRole.ADMIN })
                .expect(401, { error: `You are not authorized to change the users role to ${UserRole.ADMIN}` });
        });

        it('Should fail if you try to update another user if you are not a moderator or higher', async () => {
            const standardUser = await UserSeeding.withRole(UserRole.USER).save();
            const standardUserTwo = await UserSeeding.withRole(UserRole.USER).save();

            await agent
                .put(`/users/${standardUserTwo.id}/`)
                .set('Cookie', await cookieForUser(standardUser))
                .send({ role: UserRole.MODERATOR })
                .expect(403);
        });

        it('Should fail if you try to demote yourself', async () => {
            const user = await UserSeeding.withRole(UserRole.MODERATOR).save();

            await agent
                .put(`/users/${user.id}/`)
                .set('Cookie', await cookieForUser(user))
                .send({ role: UserRole.USER })
                .expect(401, { error: `You are not authorized to change the users role to ${UserRole.USER}` });
        });

        it('Should allow a admin to change any users roles, including themselves', async () => {
            const admin = await UserSeeding.withRole(UserRole.ADMIN).save();
            const user = await UserSeeding.withRole(UserRole.USER).save();

            await agent
                .put(`/users/${user.id}/`)
                .set('Cookie', await cookieForUser(admin))
                .send({ role: UserRole.MODERATOR })
                .expect(200);

            await agent
                .put(`/users/${user.id}/`)
                .set('Cookie', await cookieForUser(admin))
                .send({ role: UserRole.PENDING })
                .expect(200);

            await agent
                .put(`/users/${admin.id}/`)
                .set('Cookie', await cookieForUser(admin))
                .send({ role: UserRole.MODERATOR })
                .expect(200);
        });

        it('Should allow you to promote a user to your current role if you are at least a moderator', async () => {
            const admin = await UserSeeding.withRole(UserRole.ADMIN).save();
            const moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const user = await UserSeeding.withRole(UserRole.USER).save();
            const userTwo = await UserSeeding.withRole(UserRole.PENDING).save();

            await agent
                .put(`/users/${user.id}/`)
                .set('Cookie', await cookieForUser(moderator))
                .send({ role: UserRole.MODERATOR })
                .expect(200);

            await agent
                .put(`/users/${userTwo.id}/`)
                .set('Cookie', await cookieForUser(moderator))
                .send({ role: UserRole.MODERATOR })
                .expect(200);

            await agent
                .put(`/users/${user.id}/`)
                .set('Cookie', await cookieForUser(admin))
                .send({ role: UserRole.ADMIN })
                .expect(200);
        });

        it('Should allow you demote a user if you are at least a moderator and higher than them.', async () => {
            const admin = await UserSeeding.withRole(UserRole.ADMIN).save();
            const moderator = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const moderatorTwo = await UserSeeding.withRole(UserRole.MODERATOR).save();
            const user = await UserSeeding.withRole(UserRole.USER).save();

            await agent
                .put(`/users/${user.id}/`)
                .set('Cookie', await cookieForUser(moderator))
                .send({ role: UserRole.PENDING });

            await agent
                .put(`/users/${moderatorTwo.id}/`)
                .set('Cookie', await cookieForUser(moderator))
                .send({ role: UserRole.USER })
                .expect(401, { error: `You are not authorized to change the users role to ${UserRole.USER}` });

            await agent
                .put(`/users/${moderator.id}/`)
                .set('Cookie', await cookieForUser(admin))
                .send({ role: UserRole.USER })
                .expect(200);

            await agent
                .put(`/users/${moderator.id}/`)
                .set('Cookie', await cookieForUser(admin))
                .send({ role: UserRole.PENDING })
                .expect(200);
        });
    });
});
