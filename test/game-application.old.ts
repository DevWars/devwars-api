import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';

import { CompetitorFactory, GameFactory, GameTeamFactory, UserFactory } from '../app/factory';
import { Server } from '../config/Server';

import { Game, Player, UserRole } from '../app/models';
import { cookieForUser } from './helpers';

const server: Server = new Server();
let app: express.Application;

describe('game-application', () => {
    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    it('should deny an application from a signed out user', async () => {
        const game = await GameFactory.default().save();

        const response = await supertest(app)
            .post(`/game/${game.id}/applications`)
            .send();

        chai.expect(response.status).to.be.eq(403);
    });

    it('should deny an application from a signed in user without a competitor', async () => {
        const game = await GameFactory.default().save();
        const user = await UserFactory.default().save();

        const response = await supertest(app)
            .post(`/game/${game.id}/applications`)
            .set('Cookie', await cookieForUser(user))
            .send();

        chai.expect(response.status).to.be.eq(400);
    });

    it('should accept an application from a signed in user with a competitor', async () => {
        const game = await GameFactory.default().save();
        const user = await UserFactory.default().save();

        await CompetitorFactory.withUser(user).save();

        const response = await supertest(app)
            .post(`/game/${game.id}/applications`)
            .set('Cookie', await cookieForUser(user))
            .send();

        const responseGame = response.body as Game;

        chai.expect(response.status).to.be.eq(200);
        chai.expect(responseGame.id).to.be.eq(game.id);

        const gameApplications = await user.gameApplications;

        chai.expect(gameApplications).to.have.length.greaterThan(0);
    });

    it('should return a list of my applied games', async () => {
        const game = await GameFactory.default().save();
        const user = await UserFactory.default().save();

        await CompetitorFactory.withUser(user).save();

        const response = await supertest(app)
            .post(`/game/${game.id}/applications`)
            .set('Cookie', await cookieForUser(user))
            .send();

        chai.expect(response.status).to.be.eq(200);

        const gamesResponse = await supertest(app)
            .get('/game/applications/mine')
            .set('Cookie', await cookieForUser(user))
            .send();

        chai.expect(gamesResponse.status).to.be.eq(200);

        const games = gamesResponse.body as Game[];

        chai.expect(games).to.have.length.greaterThan(0);
    });

    it('should return a list of entered games', async () => {
        const game = await GameFactory.default().save();
        const teams = await GameTeamFactory.defaultTeamsForGame(game);
        const user = await UserFactory.default().save();

        for (const team of teams) {
            await team.save();
        }

        const team = teams[0];
        const player = new Player();
        player.language = 'html';
        player.user = user;
        player.team = team;

        await player.save();

        const response = await supertest(app)
            .get('/game/entered/mine')
            .set('cookie', await cookieForUser(user))
            .send();

        chai.expect(response.status).to.be.eq(200);

        const responseGame = (response.body as Game[])[0];

        chai.expect(response.body).to.be.an('array');
        chai.expect(response.body).to.have.lengthOf(1);

        chai.expect(responseGame.id).to.be.eq(game.id);
    });

    it('should be able to apply by username if admin', async () => {
        const admin = await UserFactory.withRole(UserRole.ADMIN).save();
        const applicant = await UserFactory.default().save();

        const game = await GameFactory.default().save();

        const response = await supertest(app)
            .post(`/game/${game.id}/applications/${applicant.username}`)
            .set('Cookie', await cookieForUser(admin))
            .send();

        chai.expect(response.status).to.be.eq(200);

        const gamesResponse = await supertest(app)
            .get('/game/applications/mine')
            .set('Cookie', await cookieForUser(applicant))
            .send();

        chai.expect(gamesResponse.status).to.be.eq(200);

        const games = gamesResponse.body as Game[];

        chai.expect(games).to.have.length.greaterThan(0);

        const responseGame = games[0];

        chai.expect(responseGame.id).to.be.eq(game.id);
    });
});
