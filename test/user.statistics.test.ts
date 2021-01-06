import * as supertest from 'supertest';
import * as chai from 'chai';

import { UserSeeding, UserStatsSeeding, UserGameStatsSeeding } from '../app/seeding';
import { Connection } from '../app/services/connection.service';
import ServerService from '../app/services/server.service';
import User, { UserRole } from '../app/models/user.model';
import { cookieForUser } from '../app/utils/helpers';
import UserStats from '../app/models/userStats.model';
import UserGameStats from '../app/models/userGameStats.model';

const server: ServerService = new ServerService();
let agent: any;

describe('User Statistics', () => {
    let user: User;
    let stats: UserStats;
    let gameStats: UserGameStats;

    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(async () => {
        user = await UserSeeding.withRole(UserRole.USER).save();
        stats = await UserStatsSeeding.withUser(user).save();
        gameStats = await UserGameStatsSeeding.withUser(user).save();
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('GET - /users/:user/statistics - Get the related users statistics.', () => {
        it('Should return the users statistics if the user has them', async () => {
            const response = await agent
                .get(`/users/${user.id}/statistics`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.coins).to.be.equal(stats.coins);
            chai.expect(response.body.xp).to.be.equal(stats.xp);
            chai.expect(response.body.game.loses).to.be.equal(gameStats.loses);
            chai.expect(response.body.game.wins).to.be.equal(gameStats.wins);
        });

        it('Should allow if you are not the owning user and not a admin or moderator', async () => {
            const notOwning = await UserSeeding.withRole(UserRole.USER).save();

            const response = await agent
                .get(`/users/${user.id}/statistics`)
                .set('cookie', await cookieForUser(notOwning))
                .send();

            chai.expect(response.status).to.be.equal(200);
        });
    });

    describe('GET - /users/:user/statistics/game - Get the users game statistics.', () => {
        it('Should return the users game statistics if the user has them', async () => {
            const response = await agent
                .get(`/users/${user.id}/statistics/game`)
                .set('cookie', await cookieForUser(user))
                .send();

            chai.expect(response.status).to.be.equal(200);
            chai.expect(response.body.loses).to.be.equal(gameStats.loses);
            chai.expect(response.body.wins).to.be.equal(gameStats.wins);
        });

        it('Should pass if you are not the owning user and a admin or moderator', async () => {
            for (const role of [UserRole.ADMIN, UserRole.MODERATOR]) {
                const notOwning = await UserSeeding.withRole(role).save();

                const response = await agent
                    .get(`/users/${user.id}/statistics/game`)
                    .set('cookie', await cookieForUser(notOwning))
                    .send();

                chai.expect(response.status).to.be.equal(200);
            }
        });
    });
});
