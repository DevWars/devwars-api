import * as chai from 'chai';
import * as supertest from 'supertest';
import { getCustomRepository } from 'typeorm';
import { isNil } from 'lodash';

import { Connection } from '../app/services/connection.service';
import ServerService from '../app/services/server.service';

import LinkedAccount, { Provider } from '../app/models/linkedAccount.model';
import { UserRole } from '../app/models/user.model';

import UserStatisticsRepository from '../app/repository/userStatistics.repository';
import { updateTwitchCoinsSchema } from '../app/routes/validators/linkedAccount.validator';
import { testSchemaValidation } from '../app/routes/validators';
import { UserSeeding, UserStatsSeeding } from '../app/seeding';
import { cookieForUser } from './helpers';
import LinkedAccountRepository from '../app/repository/linkedAccount.repository';

const server: ServerService = new ServerService();
let agent: any;

async function createDefaultAccountWithTwitch(): Promise<LinkedAccount> {
    const user = UserSeeding.default();
    await user.save();

    const stats = UserStatsSeeding.default();
    stats.user = user;

    await stats.save();

    const linkedAccount = new LinkedAccount(user, user.username, Provider.TWITCH, `${user.id}1`);
    await linkedAccount.save();

    return linkedAccount;
}

describe('Linked Account - Twitch', () => {
    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('GET - /oauth/:provider/:id/coins - Getting users coins by provider', () => {
        it('Should allow if the requesting user is a admin.', async () => {
            const admin = await UserSeeding.withRole(UserRole.ADMIN).save();
            const linkedUser = await createDefaultAccountWithTwitch();

            const response = await agent
                .get(`/oauth/${linkedUser.provider}/${linkedUser.providerId}/coins`)
                .set('Cookie', await cookieForUser(admin))
                .send();

            const statsRepository = getCustomRepository(UserStatisticsRepository);
            const user = await statsRepository.findOne({ user: linkedUser.user });

            chai.expect(response.status).to.eq(200);
            chai.expect(response.body.coins).to.eq(user.coins);
        });

        it('Should not pass if the API_KEY is empty or not valid', async () => {
            chai.expect(isNil(process.env.API_KEY)).to.not.eq(true);
            chai.expect(process.env.API_KEY).to.not.eq('');
        });

        it('Should not allow updating twitch coins if not a bot or admin', async () => {
            const linkedUser = await createDefaultAccountWithTwitch();

            const failResponse = await agent.get(`/oauth/${linkedUser.provider}/${linkedUser.providerId}/coins`).send();
            chai.expect(failResponse.status).to.eq(401);
        });

        it('Should return zero coins if the user does not exist.', async () => {
            const admin = await UserSeeding.withRole(UserRole.ADMIN).save();
            const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);

            const existingUser = await linkedAccountRepository.findOne({
                providerId: 'testing1011',
                provider: Provider.TWITCH,
            });

            chai.expect(isNil(existingUser)).to.be.equal(true);

            const response = await agent
                .get('/oauth/twitch/testing1011/coins')
                .set('Cookie', await cookieForUser(admin))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.coins).to.be.equal(0);
        });
    });

    describe('PATCH - /oauth/:provider/:id/coins - Updating Coins', () => {
        it('Should allow if the requesting user is a admin.', async () => {
            const admin = await UserSeeding.withRole(UserRole.ADMIN).save();
            const linkedUser = await createDefaultAccountWithTwitch();

            const requestBody = {
                amount: 100,
                username: linkedUser.username,
                apiKey: process.env.API_KEY,
            };

            const failResponse = await agent
                .patch(`/oauth/${linkedUser.provider}/${linkedUser.providerId}/coins`)
                .set('Cookie', await cookieForUser(admin))
                .send(requestBody);

            chai.expect(failResponse.status).to.eq(200);
        });

        it('Should not pass if the API_KEY is empty or not valid', async () => {
            chai.expect(isNil(process.env.API_KEY)).to.not.eq(true);
            chai.expect(process.env.API_KEY).to.not.eq('');
        });

        it('Should not allow updating twitch coins if not a bot or admin', async () => {
            const linkedUser = await createDefaultAccountWithTwitch();

            const failResponse = await agent
                .patch(`/oauth/${linkedUser.provider}/${linkedUser.providerId}/coins`)
                .send();

            chai.expect(failResponse.status).to.eq(401);
        });

        it('Should not allow updating twitch coins if the amount is not specified', async () => {
            const linkedUser = await createDefaultAccountWithTwitch();

            const requestBody = {
                username: 'username',
                apiKey: process.env.API_KEY,
            };

            await agent
                .patch(`/oauth/${linkedUser.provider}/${linkedUser.providerId}/coins`)
                .send(requestBody)
                .expect(400, { error: await testSchemaValidation(requestBody, updateTwitchCoinsSchema) });
        });

        it('Should not allow updating twitch coins if the amount is not a number', async () => {
            const linkedUser = await createDefaultAccountWithTwitch();

            const requestBody = {
                username: 'username',
                amount: 'not a number',
                apiKey: process.env.API_KEY,
            };

            await agent
                .patch(`/oauth/${linkedUser.provider}/${linkedUser.providerId}/coins`)
                .send(requestBody)
                .expect(400, { error: await testSchemaValidation(requestBody, updateTwitchCoinsSchema) });
        });

        it('Should not allow updating coins if the username is not specified', async () => {
            const linkedUser = await createDefaultAccountWithTwitch();

            const requestBody = {
                amount: 5,
                apiKey: process.env.API_KEY,
            };

            await agent
                .patch(`/oauth/${linkedUser.provider}/${linkedUser.providerId}/coins`)
                .send(requestBody)
                .expect(400, { error: await testSchemaValidation(requestBody, updateTwitchCoinsSchema) });
        });

        it('Should allow updating coins if the details is valid', async () => {
            const linkedAccount = await createDefaultAccountWithTwitch();

            const requestBody = {
                amount: 100,
                username: linkedAccount.username,
                apiKey: process.env.API_KEY,
            };

            const userStatsRepository = getCustomRepository(UserStatisticsRepository);
            const beforeUserStats = await userStatsRepository.findOne({ where: { user: linkedAccount.user } });

            const response = await agent
                .patch(`/oauth/${linkedAccount.provider}/${linkedAccount.providerId}/coins`)
                .send(requestBody);

            const userStats = await userStatsRepository.findOne({ where: { user: linkedAccount.user } });

            chai.expect(response.status).to.be.equal(200);
            chai.expect(beforeUserStats.coins + 100).to.equal(userStats.coins);
        });

        it('Should create the linked account if the user does not exist.', async () => {
            const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);

            let existingUser = await linkedAccountRepository.findOne({
                providerId: 'testing101',
                provider: Provider.TWITCH,
            });

            chai.expect(isNil(existingUser)).to.be.equal(true);

            const requestBody = {
                amount: 100,
                username: 'testing_101',
                apiKey: process.env.API_KEY,
            };

            await agent.patch('/oauth/twitch/testing101/coins').send(requestBody).expect(200);
            existingUser = await linkedAccountRepository.findOne({
                providerId: 'testing101',
                provider: Provider.TWITCH,
            });

            chai.expect(isNil(existingUser)).to.be.equal(false);
            chai.expect(existingUser.storage?.coins).to.equal(100);
        });
    });
});
