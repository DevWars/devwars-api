import * as chai from 'chai';
import * as express from 'express';

import {Server} from '../config/Server';

import {UserFactory} from '../app/factory';

const server: Server = new Server();
let app: express.Application;

describe('user-rank', () => {

    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    // Utilize UserFactory
    it('should be set from any user', async () => {
        const user = await UserFactory.default().save();

        chai.expect(user.statistics.rank).not.to.be.undefined;
        chai.expect(user.statistics.rank.level).to.be.greaterThan(0);
    });
});
