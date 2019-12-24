import * as chai from 'chai';
import * as supertest from 'supertest';

import { Connection } from '../app/services/Connection.service';
import ServerService from '../app/services/Server.service';
import {
    CONTACT_US_NAME_MAX,
    CONTACT_US_NAME_MIN,
    CONTACT_US_MESSAGE_MIN,
    CONTACT_US_MESSAGE_MAX,
} from '../app/constants';

const server: ServerService = new ServerService();
let agent: any;

describe('Contact Us ', () => {
    const validPost = {
        name: 'John Doe',
        email: 'example@example.com',
        message: 'This is a test message that is valid.',
    };

    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('POST /contact - Creating a new contact us request.', () => {
        it('Should pass if name, email and message are valid', async () => {
            await agent
                .post('/contact')
                .send(validPost)
                .expect(200);
        });

        it('Should fail if no name, email or message is provided', async () => {
            const { name, email, message } = { ...validPost };

            for (const test of [{ email, message }, { name, message }, { name, email }, {}]) {
                await agent
                    .post('/contact')
                    .send(test)
                    .expect(400);
            }
        });

        it('Should fail the name is above or below the constraints', async () => {
            let name = '';
            while (name.length < CONTACT_US_NAME_MIN - 1) name += 'A';

            await agent
                .post('/contact')
                .send({ name, email: validPost.email, message: validPost.message })
                .expect(400, {
                    error: 'name length must be at least 3 characters long, please check your content and try again',
                });

            while (name.length < CONTACT_US_NAME_MAX + 1) name += 'A';

            await agent
                .post('/contact')
                .send({ name, email: validPost.email, message: validPost.message })
                .expect(400, {
                    error:
                        'name length must be less than or equal to 64 characters long, please check your content and try again',
                });
        });

        it('Should fail the email is not a valid email.', async () => {
            const { name, message } = { ...validPost };

            const invalidEmail = 'email must be a valid email, please check your content and try again';
            const emptyEmail = 'email is not allowed to be empty, please check your content and try again';

            for (const email of ['test.com', 'testing', '@test.com']) {
                await agent
                    .post('/contact')
                    .send({ name, email, message })
                    .expect(400, { error: invalidEmail });
            }

            await agent
                .post('/contact')
                .send({ name, email: '', message })
                .expect(400, { error: emptyEmail });
        });

        it('Should fail the message is above or below the constraints', async () => {
            let message = '';
            while (message.length < CONTACT_US_MESSAGE_MIN - 1) message += 'A';

            await agent
                .post('/contact')
                .send({ name: validPost.name, email: validPost.email, message })
                .expect(400, {
                    error:
                        'message length must be at least 24 characters long, please check your content and try again',
                });

            while (message.length < CONTACT_US_MESSAGE_MAX + 1) message += 'A';

            await agent
                .post('/contact')
                .send({ message, email: validPost.email, name: validPost.name })
                .expect(400, {
                    error:
                        'message length must be less than or equal to 500 characters long, please check your content and try again',
                });
        });
    });
});
