import * as chai from "chai";
import * as express from "express";
import * as supertest from "supertest";
import {GameFactory, GameTeamFactory} from "../app/factory";
import {Server} from "../config/Server";

import {GameTeam} from "../app/models";

const server: Server = new Server();
let app: express.Application;

describe("game", () => {
    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    it("should return both teams from game id", async () => {
        const game = await GameFactory.default().save();
        const [blue, red] = GameTeamFactory.defaultTeamsForGame(game);

        await blue.save();
        await red.save();

        const response = await supertest(app).get(`/game/${game.id}/teams`).send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an("array");

        const teams = response.body as GameTeam[];

        const containsBlueTeam = teams.some((team: GameTeam) => team.id === blue.id);
        const containsRedTeam = teams.some((team: GameTeam) => team.id === red.id);

        chai.expect(containsBlueTeam).to.be.true;
        chai.expect(containsRedTeam).to.be.true;
    });
});
