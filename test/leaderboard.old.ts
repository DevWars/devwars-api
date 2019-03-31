import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import {getConnection} from 'typeorm';
import {UserFactory} from '../app/factory';
import {User} from '../app/models';
import {Server} from '../config/Server';

const server: Server = new Server();
let app: express.Application;

describe('leaderboards', () => {

    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    // Utilize UserFactory
    it('should return the user count', async () => {
        await UserFactory.default().save();

        const response = await supertest(app).get('/leaderboard/users').send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body.count).to.be.eq(1);
    });

    it('should return the users sorted by xp', async () => {
        const loser = UserFactory.default();
        const winner = UserFactory.default();

        loser.statistics.xp = 100;
        winner.statistics.xp = 1000;

        await getConnection().transaction(async (em) => {
            await em.save([winner, loser]);
        });

        const response = await supertest(app).get('/leaderboard/users').send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body.users).to.be.an('array');
        chai.expect(response.body.users).to.have.lengthOf(2);

        const [first, second] = response.body.users as User[];

        chai.expect(first.statistics.xp).to.be.eq(1000);
        chai.expect(second.statistics.xp).to.be.eq(100);
    });
});
