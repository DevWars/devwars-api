import * as chai from 'chai';
import * as supertest from 'supertest';
import { getCustomRepository } from 'typeorm';
import { isNil } from 'lodash';

import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';
import LinkedAccount, { Provider } from '../app/models/LinkedAccount';

import { updateTwitchCoinsSchema } from '../app/routes/validators/linkedAccount.validator';
import { testSchemaValidation } from '../app/routes/validators';
import { UserSeeding, UserStatsSeeding } from '../app/seeding';
import UserStatisticsRepository from '../app/repository/UserStatisticsRepository';
import { UserRole } from '../app/models/User';
import { cookieForUser } from './helpers';

const server: ServerService = new ServerService();
let agent: any;

async function createDefaultAccountWithTwitch(): Promise<LinkedAccount> {
    const user = UserSeeding.default();
    await user.save();

    const stats = UserStatsSeeding.default();
    stats.user = user;

    await stats.save();

    const linkedAccount = new LinkedAccount(user, user.username, Provider.TWITCH, `${user.username}1`);
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

    describe('PUT - /oauth/twitch/coins - Updating Coins', () => {
        const coinsRoute = '/oauth/twitch/coins';

        it('Should allow if the requesting user is a admin.', async () => {
            const admin = await UserSeeding.withRole(UserRole.ADMIN).save();
            const linkedUser = await createDefaultAccountWithTwitch();

            const requestBody = {
                updates: [
                    {
                        twitchUser: { id: linkedUser.providerId, username: linkedUser.username },
                        amount: 100,
                    },
                ],
                apiKey: process.env.API_KEY,
            };

            const failResponse = await agent
                .put(coinsRoute)
                .set('Cookie', await cookieForUser(admin))
                .send(requestBody);

            console.log(failResponse.body);
            chai.expect(failResponse.status).to.eq(200);
        });

        it('Should not pass if the API_KEY is empty or not valid', async () => {
            chai.expect(isNil(process.env.API_KEY)).to.not.eq(true);
            chai.expect(process.env.API_KEY).to.not.eq('');
        });

        it('Should not allow updating twitch coins if not a bot.', async () => {
            const failResponse = await agent.put(coinsRoute).send();
            chai.expect(failResponse.status).to.eq(401);

            await agent.put(coinsRoute).send({ apiKey: process.env.API_KEY }).expect(400);
        });

        it('Should not allow updating twitch coins if the amount is not specified.', async () => {
            const requestBody = {
                updates: [
                    {
                        twitchUser: { id: 1, username: 'username' },
                        amount: 'not a number',
                    },
                ],
                apiKey: process.env.API_KEY,
            };

            await agent
                .put(coinsRoute)
                .send(requestBody)
                .expect(400, { error: await testSchemaValidation(requestBody, updateTwitchCoinsSchema) });
        });

        it('Should not allow updating twitch coins if the amount is not a number.', async () => {
            const requestBody = {
                updates: [
                    {
                        twitchUser: { id: 1, username: 'username' },
                        amount: 'not a number',
                    },
                ],
                apiKey: process.env.API_KEY,
            };

            await agent
                .put(coinsRoute)
                .send(requestBody)
                .expect(400, { error: await testSchemaValidation(requestBody, updateTwitchCoinsSchema) });
        });

        it('Should not allow updating twitch coins if the twitch user is not specified.', async () => {
            const requestBody = {
                updates: [
                    {
                        twitchUser: {},
                        amount: 'not a number',
                    },
                ],
                apiKey: process.env.API_KEY,
            };

            await agent
                .put(coinsRoute)
                .send(requestBody)
                .expect(400, { error: await testSchemaValidation(requestBody, updateTwitchCoinsSchema) });

            await agent
                .put(coinsRoute)
                .send(requestBody)
                .expect(400, { error: await testSchemaValidation(requestBody, updateTwitchCoinsSchema) });
        });

        it('Should not allow updating twitch coins if the twitch user is not valid.', async () => {
            const requestBody = {
                updates: [
                    {
                        amount: 'not a number',
                    },
                ],
                apiKey: process.env.API_KEY,
            };

            await agent
                .put(coinsRoute)
                .send(Object.assign(requestBody, { twitchUser: { id: 'id' } }))
                .expect(400, { error: await testSchemaValidation(requestBody, updateTwitchCoinsSchema) });

            await agent
                .put(coinsRoute)
                .send(Object.assign(requestBody, { twitchUser: { username: 'username' } }))
                .expect(400, { error: await testSchemaValidation(requestBody, updateTwitchCoinsSchema) });
        });

        it('Should allow updating twitch coins if the twitch user is valid.', async () => {
            const linkedUser = await createDefaultAccountWithTwitch();
            const { user } = linkedUser;

            const requestBody = {
                updates: [
                    {
                        twitchUser: { id: linkedUser.providerId, username: linkedUser.username },
                        amount: 100,
                    },
                ],
                apiKey: process.env.API_KEY,
            };

            const userStatsRepository = getCustomRepository(UserStatisticsRepository);
            const beforeUserStats = await userStatsRepository.findOne({ where: { user } });

            await agent.put(coinsRoute).send(requestBody).expect(200);

            const userStats = await userStatsRepository.findOne({ where: { user } });
            chai.expect(beforeUserStats.coins + 100).to.equal(userStats.coins);
        });
    });
});
