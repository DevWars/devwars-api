import * as chai from "chai";
import * as express from "express";
import * as supertest from "supertest";
import {UserFactory} from "../app/factory";
import { Server } from "../config/Server";

const server: Server = new Server();
let app: express.Application;

describe("leaderboards", () => {

    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    // Utilize UserFactory
    it("should return the user count", async () => {
        await UserFactory.default().save();

        const response = await supertest(app).get(`/leaderboard/users`).send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body.count).to.be.eq(1);
    });
});
