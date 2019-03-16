import * as chai from 'chai';
import * as express from 'express';
import * as supertest from 'supertest';
import {GameFactory, GameTeamFactory, PlayerFactory, UserFactory} from '../app/factory';
import {Server} from '../config/Server';

import {getConnection} from 'typeorm';
import {Game, GameTeam, Player} from '../app/models';
import {PlayerRepository} from '../app/repository';
import GameService from '../app/services/Game.service';

const server: Server = new Server();
let app: express.Application;

describe('end-game', () => {
    let game: Game;
    let winner: GameTeam;
    let loser: GameTeam;

    beforeEach(async () => {
        await server.Start();

        app = server.App();

        await getConnection().transaction(async (em) => {
            game = GameFactory.default();
            winner = GameTeamFactory.withGame(game);
            loser = GameTeamFactory.withGame(game);

            winner.name = 'red';
            loser.name = 'blue';

            const redPlayers = PlayerFactory.defaultPlayersForTeam(winner);
            const bluePlayers = PlayerFactory.defaultPlayersForTeam(loser);

            const users = [...redPlayers, ...bluePlayers].map((player: Player) => {
                const user = UserFactory.default();

                user.statistics.xp = 0;
                user.statistics.coins = 0;

                player.user = user;

                return user;
            });

            await em.save([game, winner, loser, ...redPlayers, ...bluePlayers, ...users]);
        });

        const fresh = await Game.findOne(game.id);

        await GameService.endGame(fresh, winner);
    });

    it('should distribute 300 xp to a winning team', async () => {
        const winningPlayers = await PlayerRepository.forTeam(winner);

        for (const player of winningPlayers) {
            chai.expect(player.user.statistics.xp).to.be.eq(300);
        }
    });

    it('should distribute 50 xp to a losing team', async () => {
        const losingPlayers = await PlayerRepository.forTeam(loser);

        for (const player of losingPlayers) {
            chai.expect(player.user.statistics.xp).to.be.eq(50);
        }
    });

    it('should distribute 600 coins to a winning team', async () => {
        const winningPlayers = await PlayerRepository.forTeam(winner);

        for (const player of winningPlayers) {
            chai.expect(player.user.statistics.coins).to.be.eq(600);
        }
    });

    it('should distribute 200 coins to a losing team', async () => {
        const losingPlayers = await PlayerRepository.forTeam(loser);

        for (const player of losingPlayers) {
            chai.expect(player.user.statistics.coins).to.be.eq(200);
        }
    });
});
