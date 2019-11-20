import * as chai from 'chai';
import * as supertest from 'supertest';
import { getCustomRepository } from 'typeorm';
import { isNil } from 'lodash';

import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';

import LinkedAccountRepository from '../app/repository/LinkedAccount.repository';
import LinkedAccount, { Provider } from '../app/models/LinkedAccount';

import { updateTwitchCoinsSchema } from '../app/routes/validators/linkedAccount.validator';
import { testSchemaValidation } from '../app/routes/validators';
import { UserSeeding } from '../app/seeding';

const server: ServerService = new ServerService();
let agent: any;

async function createDefaultAccountWithTwitch() {
    const user = UserSeeding.default();
    await user.save();

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

        it('Should not pass if the API_KEY is empty or not valid', async () => {
            chai.expect(isNil(process.env.API_KEY)).to.not.eq(true);
            chai.expect(process.env.API_KEY).to.not.eq('');
        });

        it('Should not allow updating twitch coins if not a bot.', async () => {
            const failResponse = await agent.put(coinsRoute).send();
            chai.expect(failResponse.status).to.eq(403);

            await agent
                .put(coinsRoute)
                .send({ apiKey: process.env.API_KEY })
                .expect(400);
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

            const requestBody = {
                updates: [
                    {
                        twitchUser: { id: linkedUser.providerId, username: linkedUser.username },
                        amount: 100,
                    },
                ],
                apiKey: process.env.API_KEY,
            };

            const response = await agent
                .put(coinsRoute)
                .send(requestBody)
                .expect(200);

            const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
            const account = await linkedAccountRepository.findByProviderAndProviderId(
                Provider.TWITCH,
                requestBody.updates[0].twitchUser.id
            );

            // Don't compare User relation
            delete account.user;

            chai.expect(JSON.stringify(response.body[0])).to.equal(JSON.stringify(account));
            chai.expect(response.body[0].storage.coins).to.equal(account.storage.coins);
            chai.expect(account.storage.coins).to.equal(100);
        });
    });
});
