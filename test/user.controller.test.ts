import * as supertest from 'supertest';
import { SuperTest, Test } from 'supertest';
import * as chai from 'chai';
import * as _ from 'lodash';

import { ActivitySeeding, GameApplicationSeeding, GameScheduleSeeding, UserSeeding } from '../app/seeding';

import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';
import { cookieForUser } from './helpers';

import EmailVerification from '../app/models/EmailVerification';
import GameApplication from '../app/models/GameApplication';
import UserGameStats from '../app/models/UserGameStats';
import LinkedAccount, { Provider } from '../app/models/LinkedAccount';
import PasswordReset from '../app/models/PasswordReset';
import UserProfile from '../app/models/UserProfile';
import User, { UserRole } from '../app/models/User';
import UserStats from '../app/models/UserStats';
import Activity from '../app/models/Activity';
import LinkedAccountRepository from '../app/repository/LinkedAccount.repository';
import { getCustomRepository } from 'typeorm';

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
            const gameScheduleOne = await GameScheduleSeeding.default().save();
            const gameScheduleTwo = await GameScheduleSeeding.default().save();

            await GameApplicationSeeding.withScheduleAndUser(gameScheduleOne, tempUser).save();
            await GameApplicationSeeding.withScheduleAndUser(gameScheduleTwo, tempUser).save();

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

    describe('GET - /users/{userId}/connections - Perform gathering user connections', async () => {
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

        it('Should fail if not authenticated', async () => {
            await agent.get(`/users/${tempUser.id}/connections`).expect(401);
        });

        it('Should fail if authenticated but not owning user', async () => {
            await agent.get(`/users/${moderator.id}/connections`).expect(401);
        });

        it('Should return connections for any user if authenticated as a moderator or above', async () => {
            for (const user of [moderator, administrator]) {
                await agent
                    .get(`/users/${tempUser.id}/connections`)
                    .set('Cookie', await cookieForUser(user))
                    .expect(200, []);
            }
        });

        it('Should return a empty list of connections if a user does not have any', async () => {
            await agent
                .get(`/users/${tempUser.id}/connections`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(200, []);
        });

        it('Should return all connections that exist for the user', async () => {
            const { username } = tempUser;

            const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);

            const linkedAccountDiscord = new LinkedAccount(tempUser, username, Provider.DISCORD, `${tempUser.id}1`);
            const linkedAccountTwitch = new LinkedAccount(tempUser, username, Provider.TWITCH, `${tempUser.id}2`);

            await linkedAccountDiscord.save();

            const connections = await linkedAccountRepository.findAllByUserId(tempUser.id);
            const connectionsBody = connections.map((e) => JSON.parse(JSON.stringify(e)));

            await agent
                .get(`/users/${tempUser.id}/connections`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(200, connectionsBody);

            await linkedAccountTwitch.save();

            const updatedConnections = await linkedAccountRepository.findAllByUserId(tempUser.id);
            const updatedConnectionsBody = updatedConnections.map((e) => JSON.parse(JSON.stringify(e)));

            await agent
                .get(`/users/${tempUser.id}/connections`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(200, updatedConnectionsBody);
        });
    });

    describe('GET - /users/{userId}/connections/{provider} - Perform user connections by provider', async () => {
        let tempUser: User;

        beforeEach(async () => {
            tempUser = await UserSeeding.withRole(UserRole.USER).save();
        });

        it('Should fail if not authenticated', async () => {
            await agent.get(`/users/${tempUser.id}/connections/discord`).expect(401);
        });

        it('Should fail if if the no connections exist by the provider', async () => {
            await agent
                .get(`/users/${tempUser.id}/connections/discord`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(404, {
                    error: `Connection does not exist for user ${tempUser.username} with third-party Discord`,
                });
        });

        it('Should fail if not a valid provider is used', async () => {
            await agent
                .get(`/users/${tempUser.id}/connections/notvalid`)
                .set('Cookie', await cookieForUser(tempUser))
                .expect(400, {
                    error: 'notvalid is not a valid provider.',
                });
        });

        it('should return only that provider for the current provider specified', async () => {
            const { username } = tempUser;

            const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);

            const linkedAccountDiscord = new LinkedAccount(tempUser, username, Provider.DISCORD, `${tempUser.id}1`);
            const linkedAccountTwitch = new LinkedAccount(tempUser, username, Provider.TWITCH, `${tempUser.id}2`);

            await linkedAccountDiscord.save();

            const discord = await linkedAccountRepository.findByUserIdAndProvider(tempUser.id, Provider.DISCORD);

            const result = await agent
                .get(`/users/${tempUser.id}/connections/${Provider.DISCORD}`)
                .set('Cookie', await cookieForUser(tempUser));

            chai.expect(result.status).to.be.equal(200);
            chai.expect(result.body.username).to.be.equal(discord.username);
            chai.expect(result.body.provider).to.be.equal(discord.provider.toLowerCase());

            await linkedAccountTwitch.save();
            const twitch = await linkedAccountRepository.findByUserIdAndProvider(tempUser.id, Provider.TWITCH);

            const resultTwo = await agent
                .get(`/users/${tempUser.id}/connections/${Provider.TWITCH}`)
                .set('Cookie', await cookieForUser(tempUser));

            chai.expect(resultTwo.status).to.be.equal(200);
            chai.expect(resultTwo.body.username).to.be.equal(twitch.username);
            chai.expect(resultTwo.body.provider).to.be.equal(twitch.provider.toLowerCase());
        });
    });

    describe('PUT - /users/{userId} - Update a given user by the provided id', async () => {
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
