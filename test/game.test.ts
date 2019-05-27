import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import { getManager, EntityManager } from 'typeorm';
import { random } from 'faker';
import * as _ from 'lodash';

import { GameFactory, UserFactory } from '../app/factory';
import { UserRole } from '../app/models/User';
import { cookieForUser } from './helpers';
import { Server } from '../config/Server';
import Game from '../app/models/Game';

import './setup';

const server: Server = new Server();
let app: express.Application;

// used for the creation of the database transactions without the need of constantly calling into
// get manager everytime a test needs a transaction.
const connectionManager: EntityManager = getManager();

describe('game', () => {
    before(async () => {
        await server.Start();
        app = server.App();
    });

    it('POST - games - normal user fail oauth', async () => {
        const user = UserFactory.withRole(UserRole.USER);
        const game = await GameFactory.default();

        const response = await supertest(app)
            .post('/games')
            .set('Cookie', await cookieForUser(user))
            .send(game);

        chai.expect(response.status).to.be.eq(403);
    });

    it('POST - games - mod user ok oauth', async () => {
        const game = await GameFactory.default();
        const user = UserFactory.withRole(UserRole.MODERATOR);

        const response = await supertest(app)
            .post('/games')
            .set('Cookie', await cookieForUser(user))
            .send(game);

        chai.expect(response.status).to.be.eq(201);
        chai.expect(response.body.mode).to.be.eq(game.mode);
    });

    it('POST - games - admin user ok oauth', async () => {
        const game = await GameFactory.default();
        const user = UserFactory.withRole(UserRole.ADMIN);

        const response = await supertest(app)
            .post('/games')
            .set('Cookie', await cookieForUser(user))
            .send(game);

        chai.expect(response.status).to.be.eq(201);
        chai.expect(response.body.mode).to.be.eq(game.mode);
    });

    it('GET - games', async () => {
        const game1 = await GameFactory.default();
        const game2 = await GameFactory.default();

        await connectionManager.transaction(async (transaction) => {
            await transaction.save(game1);
            await transaction.save(game2);
        });

        const response = await supertest(app)
            .get('/games')
            .send();

        chai.expect(response.body.length).to.be.equal(2);
    });

    it('GET - games/latest', async () => {
        const game1 = await GameFactory.default();
        const game2 = await GameFactory.default();

        await connectionManager.transaction(async (transaction) => {
            await transaction.save(game2);
            await transaction.save(game1);
        });

        const response = await supertest(app)
            .get('/games/latest')
            .send();

        chai.expect(response.body.id).to.be.eq(game2.id);
    });

    it('GET - games/:id', async () => {
        const game1 = await GameFactory.default();
        const game2 = await GameFactory.default();
        const game3 = await GameFactory.default();

        await connectionManager.transaction(async (transaction) => {
            await transaction.save(game1);
            await transaction.save(game2);
            await transaction.save(game3);
        });

        const response = await supertest(app)
            .get(`/games/${game2.id}`)
            .send();

        chai.expect(response.body.id).to.be.eq(game2.id);
    });

    it('PATCH - games/:id - normal user failed', async () => {
        const user = UserFactory.withRole(UserRole.USER);
        const game = await GameFactory.default();
        await game.save();

        const response = await supertest(app)
            .patch(`/games/${game.id}`)
            .set('Cookie', await cookieForUser(user))
            .send();

        chai.expect(response.status).to.be.eq(403);
    });

    it('PATCH - games/:id - mod user fail because not found', async () => {
        const user = UserFactory.withRole(UserRole.MODERATOR);
        const game = await GameFactory.default();
        await game.save();

        const response = await supertest(app)
            .patch('/games/3')
            .set('Cookie', await cookieForUser(user))
            .send();

        chai.expect(response.status).to.be.eq(404);
    });

    it('PATCH - games/:id - mod user', async () => {
        const user = UserFactory.withRole(UserRole.MODERATOR);
        const game = await GameFactory.withMode('Blitz');
        await game.save();

        const response = await supertest(app)
            .patch(`/games/${game.id}`)
            .set('Cookie', await cookieForUser(user))
            .send({
                mode: 'Classic',
            });

        chai.expect(response.body.mode).to.be.eq('Classic');
    });

    it('PATCH - games/:id - admin user', async () => {
        const user = UserFactory.withRole(UserRole.ADMIN);
        const game = await GameFactory.withMode('Blitz');
        await game.save();

        const response = await supertest(app)
            .patch(`/games/${game.id}`)
            .set('Cookie', await cookieForUser(user))
            .send({
                mode: 'Classic',
            });

        chai.expect(response.body.mode).to.be.eq('Classic');
    });

    // TODO: need finish end method in controller
    // it('POST - games/:id/end - normal user ', async () => {
    //     const user = UserFactory.withRole(UserRole.USER);
    //     const game = await GameFactory.withMode('Blitz').save();

    //     const response = await supertest(app)
    //         .patch(`/games/${game.id}/end`)
    //         .set('Cookie', await cookieForUser(user))
    //         .send()

    //     chai.expect(response.status).to.be.eq(403);
    // })

    // it('POST - games/:id/end - mod user ', async () => {
    //     const user = UserFactory.withRole(UserRole.MODERATOR);
    //     const game = await GameFactory.withMode('Blitz').save();

    //     const response = await supertest(app)
    //         .patch(`/games/${game.id}/end`)
    //         .set('Cookie', await cookieForUser(user))
    //         .send()

    //     chai.expect(response.status).to.be.eq(200);
    // })

    // it('POST - games/:id/end - admin user ', async () => {
    //     const user = UserFactory.withRole(UserRole.ADMIN);
    //     const game = await GameFactory.withMode('Blitz').save();

    //     const response = await supertest(app)
    //         .patch(`/games/${game.id}/end`)
    //         .set('Cookie', await cookieForUser(user))
    //         .send()

    //     chai.expect(response.status).to.be.eq(200);
    // })

    it('GET - games/season/:season', async () => {
        await connectionManager.transaction(async (transaction) => {
            const game1 = await GameFactory.withSeason(2);
            const game2 = await GameFactory.withSeason(2);
            const game3 = await GameFactory.withSeason(3);
            const game4 = await GameFactory.withSeason(1);

            await transaction.save(game1);
            await transaction.save(game2);
            await transaction.save(game3);
            await transaction.save(game4);
        });

        const season = random.arrayElement([{ id: 1, amount: 1 }, { id: 2, amount: 2 }, { id: 3, amount: 1 }]);

        const response = await supertest(app)
            .get(`/games/season/${season.id}`)
            .send();

        chai.expect(response.body.length).to.be.eq(season.amount);
        _.forEach(response.body, (game: Game) => chai.expect(game.season).to.be.eq(season.id));
    });
});
