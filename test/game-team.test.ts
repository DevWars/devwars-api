import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import {GameFactory, GameTeamFactory, ObjectiveFactory, UserFactory} from '../app/factory';
import {Server} from '../config/Server';

import {GameTeam, UserRole} from '../app/models';
import {cookieForUser} from './helpers';

const server: Server = new Server();
let app: express.Application;

describe('game-team', () => {
    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    it('should return both teams from game id', async () => {
        const game = await GameFactory.default().save();
        const [blue, red] = GameTeamFactory.defaultTeamsForGame(game);

        await blue.save();
        await red.save();

        const response = await supertest(app).get(`/game/${game.id}/teams`).send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an('array');

        const teams = response.body as GameTeam[];

        const containsBlueTeam = teams.some((team: GameTeam) => team.id === blue.id);
        const containsRedTeam = teams.some((team: GameTeam) => team.id === red.id);

        chai.expect(containsBlueTeam).to.be.true;
        chai.expect(containsRedTeam).to.be.true;
    });

    it('can be updated as an admin', async () => {
        const objective = await ObjectiveFactory.default().save();
        const admin = await UserFactory.withRole(UserRole.ADMIN);
        let team = await GameTeamFactory.default().save();

        const updates = {
            completedObjectives: [objective],
            status: 'Setting up Discord',
            votes: {
                ui: 60,
                ux: 22,
            },
            winner: true,
        };

        const response = await supertest(app)
            .put(`/game/team/${team.id}`)
            .set('cookie', await cookieForUser(admin))
            .send(updates);

        team = response.body as GameTeam;

        chai.expect(response.status).to.be.eq(200);

        chai.expect(team.votes.ui).to.be.eq(updates.votes.ui);
        chai.expect(team.votes.ux).to.be.eq(updates.votes.ux);
        chai.expect(team.winner).to.be.eq(updates.winner);
        chai.expect(team.status).to.be.eq(updates.status);
        chai.expect(team.completedObjectives).to.have.lengthOf(1);
    });
});
