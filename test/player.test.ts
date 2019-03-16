import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import {GameFactory, GameTeamFactory, PlayerFactory, UserFactory} from '../app/factory';
import {Server} from '../config/Server';

import {Player, UserRole} from '../app/models';
import {PlayerRepository} from '../app/repository';
import {cookieForUser} from './helpers';

const server: Server = new Server();
let app: express.Application;

describe('player', () => {
    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    it('should return all players from all teams', async () => {
        const game = GameFactory.default();
        await game.save();

        const teams = GameTeamFactory.defaultTeamsForGame(game);

        for (const team of teams) {
            await team.save();

            const players = PlayerFactory.defaultPlayersForTeam(team);

            for (const player of players) {
                await player.save();
            }

            const response = await supertest(app).get(`/game/${game.id}/team/${team.name}/players`).send();

            chai.expect(response.status).to.be.eq(200);
            chai.expect(response.body).to.be.an('array');

            const responsePlayers = response.body as Player[];

            chai.expect(responsePlayers.length).to.be.eq(players.length);
        }
    });

    it('should be able to be added to a team with a user and language', async () => {
        const user = await UserFactory.withRole(UserRole.ADMIN).save();
        const game = await GameFactory.default().save();
        const team = await GameTeamFactory.withGame(game).save();

        const response = await supertest(app)
            .post(`/game/team/${team.id}/players`)
            .set('Cookie', await cookieForUser(user))
            .query({language: 'HTML', user: user.id})
            .send();

        chai.expect(response.status).to.be.eq(200);

        const players = await PlayerRepository.forTeam(team);

        chai.expect(players).to.have.lengthOf(1);
        chai.expect(players[0].user.id).to.be.eq(user.id);
    });

    it('should be able to be removed by an admin', async () => {
        const user = await UserFactory.default().save();
        const admin = await UserFactory.withRole(UserRole.ADMIN).save();
        const game = await GameFactory.default().save();
        const team = await GameTeamFactory.withGame(game).save();
        const player = await PlayerFactory.withTeamAndLanguageAndUser(team, 'HTML', user).save();

        let players = await PlayerRepository.forTeam(team);

        chai.expect(players).to.have.lengthOf(1);

        const response = await supertest(app)
            .delete(`/game/players/${player.id}`)
            .set('Cookie', await cookieForUser(admin))
            .send();

        chai.expect(response.status).to.be.eq(200);

        players = await PlayerRepository.forTeam(team);

        chai.expect(players).to.have.lengthOf(0);
    });

});
