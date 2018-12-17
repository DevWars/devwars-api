import * as chai from "chai";
import * as express from "express";
import * as supertest from "supertest";
import {GameFactory, GameTeamFactory, PlayerFactory} from "../app/factory";
import {Server} from "../config/Server";

import {Player} from "../app/models";

const server: Server = new Server();
let app: express.Application;

describe("player", () => {
    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    it("should return all players from all teams", async () => {
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
            chai.expect(response.body).to.be.an("array");

            const responsePlayers = response.body as Player[];

            chai.expect(responsePlayers.length).to.be.eq(players.length);
        }
    });
});
