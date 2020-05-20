import * as supertest from 'supertest';
// import { SuperTest, Test } from 'supertest';

import { Connection } from '../app/services/connection.service';
import ServerService from '../app/services/server.service';
const server: ServerService = new ServerService();
/* eslint-disable @typescript-eslint/no-unused-vars */
let agent;

describe('Game Applications', () => {
    before(async () => {
        await server.Start();
        await (await Connection).synchronize(true);
    });

    beforeEach(() => {
        agent = supertest.agent(server.App());
    });

    describe('GET - /games/:game/applications - Get all game applications', () => {
        it.skip('Should fail if the user is not a moderator or higher');
        it.skip('Should only return related game applications');
        it.skip('Should return game applications for the given game');
    });

    describe('POST - /games/:game/applications/:user - Apply to game with application.', () => {
        it.skip('Should fail if the user is not a moderator or higher and not set user');
        it.skip('Should pass if the user is a moderator or higher and not set user');
        it.skip('Should fail if the given user is already applied');
        it.skip('Should apply to the given game if not already applied');
    });

    describe('GET - /games/:game/applications/:user - Get the users application to game.', () => {
        it.skip('Should fail if the user is not a moderator or higher and not set user');
        it.skip('Should pass if the user is a moderator or higher and not set user');
        it.skip('Should fail if the given user is not applied');
        it.skip('Should return the users application if applied.');
    });

    describe('DELETE - /games/:game/applications/:user - Remove the users application to game.', () => {
        it.skip('Should fail if the user is not a moderator or higher and not set user');
        it.skip('Should pass if the user is a moderator or higher and not set user');
        it.skip('Should fail if the given user is not applied');
        it.skip('Should remove the application if the user is applied.');
    });
});
