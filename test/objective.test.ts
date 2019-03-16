import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import {GameFactory, GameTeamFactory, ObjectiveFactory} from '../app/factory';
import {Server} from '../config/Server';

import {getConnection} from 'typeorm';
import {GameTeam, Objective} from '../app/models';
import {ObjectiveRepository} from '../app/repository';

const server: Server = new Server();
let app: express.Application;

describe('game', () => {
    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    it('should return all objectives from game id', async () => {
        const game = await GameFactory.default().save();
        const objectives = ObjectiveFactory.defaultObjectivesForGame(game);

        for (const objective of objectives) {
            await objective.save();
        }

        const response = await supertest(app).get(`/game/${game.id}/objectives`).send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an('array');

        const responseObjectives = response.body as Objective[];

        chai.expect(responseObjectives.length).to.be.eq(objectives.length);
    });

    it('should be able to update objectives for a game', async () => {
        const game = await GameFactory.default().save();
        const objectives = ObjectiveFactory.defaultObjectivesForGame(game, 5);

        for (const objective of objectives) {
            await objective.save();
        }

        const newObjectives = ObjectiveFactory.defaultObjectivesForGame(game, 3);

        const response = await supertest(app).post(`/game/${game.id}/objectives`).send(newObjectives);

        chai.expect(response.status).to.be.eq(200);

        const freshObjectives = await ObjectiveRepository.forGame(game);

        chai.expect(freshObjectives).to.have.lengthOf(newObjectives.length);
    });

    it('should save completed objectives for team when updating objective', async () => {
        const game = await GameFactory.default();
        const teams = GameTeamFactory.defaultTeamsForGame(game);
        const objectives = ObjectiveFactory.defaultObjectivesForGame(game);

        const completedObjective = objectives[0];

        for (const team of teams) {
            team.completedObjectives = [completedObjective];
        }

        await getConnection().transaction(async (transaction) => {
            await transaction.save([game, ...teams, ...objectives]);
        });

        for (const team of teams) {
            const fresh = await GameTeam.findOne(team.id);

            chai.expect(fresh.completedObjectives).to.have.lengthOf(1);
        }

        const newObjective = new Objective();
        newObjective.number = completedObjective.number;
        newObjective.description = 'Fresh One';

        await supertest(app).post(`/game/${game.id}/objectives`).send([newObjective]);

        for (const team of teams) {
            const fresh = await GameTeam.findOne(team.id);

            chai.expect(fresh.completedObjectives).to.have.lengthOf(1);
        }

        chai.expect(await ObjectiveRepository.forGame(game)).to.have.lengthOf(1);
    });
});
