import { Request, Response } from 'express';

import Game from '../../models/Game';

import GameRepository from '../../repository/Game.repository';
import GameTeamRepository from '../../repository/GameTeam.repository';
import { IUpdateGameRequest } from '../../request/IUpdateGameRequest';
import GameService from '../../services/Game.service';

export class GameController {
    public static async all(request: Request, response: Response) {
        const games = await GameRepository.all();

        response.json(games);
    }

    public static async show(request: Request, response: Response) {
        const game = await GameRepository.byId(request.params.game);

        if (!game) {
            return response.status(404).send('No game for this ID');
        }

        response.json(game);
    }

    public static async update(request: Request, response: Response) {
        const id = request.params.id;
        const params = request.body as IUpdateGameRequest;

        let game = await GameRepository.byId(id);

        Object.assign(game, params);
        game.startTime = new Date(params.startTime);

        game.teams = undefined;
        game.objectives = undefined;

        await game.save();

        const isActive = game.status === GameStatus.ACTIVE;

        game = await GameRepository.byId(game.id);

        if (game.status === GameStatus.ACTIVE) {
            await GameService.sendGameToFirebase(game);
        }

        response.json(game);
    }

    public static async end(request: Request, response: Response) {
        const game = await GameRepository.byId(request.params.id);
        const winner = await GameTeamRepository.byId(request.query.winner);

        if (!game) {
            return response.status(404).send('No game for this ID');
        }

        await GameService.backupGame(game);
        await GameService.endGame(game, winner);

        response.json({
            message: 'Success',
        });
    }

    public static async latest(request: Request, response: Response) {
        const game = await GameRepository.latest();

        if (!game) {
            return response.status(404).send('There is not latest game to be found');
        }

        response.json(game);
    }

    public static async bySeason(request: Request, response: Response) {
        const season = request.params.season;

        const games = await GameRepository.bySeason(season);

        response.json(games);
    }

    public static async byStatus(request: Request, response: Response) {
        const toEnum: string = (request.params.status || '').toUpperCase();
        const status: GameStatus = (GameStatus as any)[toEnum];

        const games = await GameRepository.byStatus(status);

        response.json(games);
    }

    public static async createGame(request: Request, response: Response) {
        const { name, timestamp } = request.body;

        let game = new Game();

        game.name = name;
        game.startTime = new Date(timestamp);
        await game.save();

        for (const teamName of ['blue', 'red']) {
            const team = new GameTeam();

            team.name = teamName;
            team.game = game;

            await team.save();
        }

        game = await GameRepository.byId(game.id);

        response.json(game);
    }

    // TO-DO: past() games with the status of ENDED
}
