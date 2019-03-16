import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import {GameFactory, GameTeamFactory, UserFactory} from '../app/factory';
import {Server} from '../config/Server';

import {Game, GameStatus, GameTeam, UserRole} from '../app/models';
import {GameRepository} from '../app/repository';
import {IUpdateGameRequest} from '../app/request/IUpdateGameRequest';
import GameService from '../app/services/Game.service';
import {cookieForUser} from './helpers';

const server: Server = new Server();
let app: express.Application;

describe('game', () => {
    const seasons = [1, 2, 3];
    const statuses: GameStatus[] = [GameStatus.SCHEDULING, GameStatus.PREPARING, GameStatus.ACTIVE, GameStatus.ENDED];

    beforeEach(async () => {
        await server.Start();

        app = server.App();
    });

    it('should return all games', async () => {
        await GameFactory.default().save();

        const response = await supertest(app).get('/game').send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an('array');
    });

    it('should return one game by id', async () => {
        const game = await GameFactory.default().save();

        const response = await supertest(app).get(`/game/${game.id}`).send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an('object');
    });

    it('should return 404 when the id has no game', async () => {
        const response = await supertest(app).get('/game/92380408').send();

        chai.expect(response.status).to.be.eq(404);
    });

    it('should return latest game', async () => {
        const before = await GameFactory.withTime(new Date(new Date().getTime() - 1000)).save();
        const latest = await GameFactory.withTime(new Date()).save();

        const response = await supertest(app).get('/game/latest').send();

        chai.expect(response.status).to.be.eq(200);
        chai.expect(response.body).to.be.an('object');

        const game = response.body as Game;

        chai.expect(game.id).to.be.eq(latest.id);
        chai.expect(game.id).not.to.be.eq(before.id);

    });

    it('should return all games in season', async () => {
        for (const season of seasons) {
            await GameFactory.withSeason(season).save();

            const response = await supertest(app).get(`/game/season/${season}`).send();

            chai.expect(response.status).to.be.eq(200);
            chai.expect(response.body).to.be.an('array');

            const games = response.body as Game[];

            chai.expect(games.length).to.be.eq(1);

            for (const game of games) {
                chai.expect(game.season).to.be.eq(season);
            }
        }
    });

    it('should return all games with matching status', async () => {
        for (const status of statuses) {
            const statusName: string = GameStatus[status].toLowerCase();
            await GameFactory.withStatus(status as GameStatus).save();

            const response = await supertest(app).get(`/game/status/${statusName}`).send();

            chai.expect(response.status).to.be.eq(200);
            chai.expect(response.body).to.be.an('array');

            const games = response.body as Game[];

            chai.expect(games.length).to.be.eq(1);

            for (const game of games) {
                chai.expect(game.status).to.be.eq(status);
            }
        }
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
        const admin = await UserFactory.withRole(UserRole.ADMIN);
        const game = await GameFactory.default().save();

        const newData: IUpdateGameRequest = {
            name: 'New Name',
            season: 1,
            startTime: new Date().getTime(),
            status: GameStatus.PREPARING,
            theme: 'Something Else',
            videoUrl: 'https://youtube.com',
        };

        const response = await supertest(app)
            .put(`/game/${game.id}`)
            .set('cookie', await cookieForUser(admin))
            .send(newData);

        chai.expect(response.status).to.be.eq(200);

        const freshGame = await GameRepository.byId(game.id);

        chai.expect(freshGame).not.to.be.null;

        chai.expect(freshGame.name).to.be.eq(newData.name);
        chai.expect(freshGame.season).to.be.eq(newData.season);
        chai.expect(freshGame.status).to.be.eq(newData.status);
        chai.expect(freshGame.theme).to.be.eq(newData.theme);
        chai.expect(freshGame.videoUrl).to.be.eq(newData.videoUrl);

        chai.expect(freshGame.startTime.getTime()).to.be.eq(newData.startTime);
    });
});
