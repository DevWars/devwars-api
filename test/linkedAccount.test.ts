import * as chai from 'chai';
import * as supertest from 'supertest';
import { getCustomRepository } from 'typeorm';
import { isNil } from 'lodash';

import LinkedAccountRepository from '../app/repository/LinkedAccount.repository';
import LinkedAccount, { Provider } from '../app/models/LinkedAccount';
import { UserSeeding } from '../app/seeding';
import ServerService from '../app/services/Server.service';

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
                twitchUser: { id: 1, username: 'username' },
                apiKey: process.env.API_KEY,
            };

            await agent
                .put(coinsRoute)
                .send(requestBody)
                .expect(400, { error: 'Amount not provided.' });
        });

        it('Should not allow updating twitch coins if the amount is not a number.', async () => {
            const requestBody = {
                twitchUser: { id: 1, username: 'username' },
                apiKey: process.env.API_KEY,
                amount: 'not a number',
            };

            await agent
                .put(coinsRoute)
                .send(requestBody)
                .expect(400, { error: 'Amount provided is not a valid number.' });
        });

        it('Should not allow updating twitch coins if the twitch user is not specified.', async () => {
            const requestBody: any = {
                apiKey: process.env.API_KEY,
                amount: 'not a number',
            };

            await agent
                .put(coinsRoute)
                .send(requestBody)
                .expect(400, { error: 'User not provided.' });

            requestBody.twitchUser = {};

            await agent
                .put(coinsRoute)
                .send(requestBody)
                .expect(400, { error: 'User not provided.' });
        });

        it('Should not allow updating twitch coins if the twitch user is not valid.', async () => {
            const requestBody = {
                apiKey: process.env.API_KEY,
                amount: 'not a number',
            };

            await agent
                .put(coinsRoute)
                .send(Object.assign(requestBody, { twitchUser: { id: 'id' } }))
                .expect(400, { error: 'User not provided.' });

            await agent
                .put(coinsRoute)
                .send(Object.assign(requestBody, { twitchUser: { username: 'username' } }))
                .expect(400, { error: 'User not provided.' });
        });

        it('Should allow updating twitch coins if the twitch user is valid.', async () => {
            const linkedUser = await createDefaultAccountWithTwitch();

            const requestBody = {
                twitchUser: { id: `${linkedUser.username}1`, username: linkedUser.username },
                apiKey: process.env.API_KEY,
                amount: 100,
            };

            const response = await agent
                .put(coinsRoute)
                .send(requestBody)
                .expect(200);

            const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
            const account = await linkedAccountRepository.findByProviderAndProviderId(
                Provider.TWITCH,
                requestBody.twitchUser.id
            );

            chai.expect(JSON.stringify(response.body)).to.equal(JSON.stringify(account));
            chai.expect(response.body.storage.coins).to.equal(account.storage.coins);
            chai.expect(account.storage.coins).to.equal(100);
        });
    });
});
