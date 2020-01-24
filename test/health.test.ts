import * as supertest from 'supertest';
import ServerService from '../app/services/Server.service';

const server: ServerService = new ServerService();
let agent: supertest.SuperTest<supertest.Test> = null;

describe('Health', () => {
    before(async () => {
        await server.Start();
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    it('GET - /health - should return healthy and the current version number', async () => {
        const packageJson = require('../package');
        await agent.get('/health').expect(200, {
            status: 'Healthy',
            version: packageJson.version,
        });
    });
});
