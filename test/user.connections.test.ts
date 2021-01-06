import * as supertest from 'supertest';
import * as chai from 'chai';

import { Connection } from '../app/services/connection.service';
import ServerService from '../app/services/server.service';
import { UserSeeding } from '../app/seeding';
import { cookieForUser } from '../app/utils/helpers';
import User, { UserRole } from '../app/models/user.model';
import { getCustomRepository } from 'typeorm';
import LinkedAccount, { Provider } from '../app/models/linkedAccount.model';
import LinkedAccountRepository from '../app/repository/linkedAccount.repository';

const server: ServerService = new ServerService();
let agent: any;

describe('User Connections', () => {
    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
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
});
