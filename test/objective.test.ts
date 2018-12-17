import * as chai from "chai";
import * as express from "express";
import * as supertest from "supertest";
import {GameFactory, ObjectiveFactory} from "../app/factory";
import {Server} from "../config/Server";

import {Objective} from "../app/models";

const server: Server = new Server();
let app: express.Application;

describe("game", () => {
    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    it("should return all objectives from game id", async () => {
        const game = await GameFactory.default().save();
        const objectives = ObjectiveFactory.defaultObjectivesForGame(game);

        for (const objective of objectives) {
            await objective.save();
        }

        const response = await supertest(app).get(`/game/${game.id}/objectives`).send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an("array");

        const responseObjectives = response.body as Objective[];

        chai.expect(responseObjectives.length).to.be.eq(objectives.length);
    });
});
