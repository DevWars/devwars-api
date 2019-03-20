import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';

import Game from '../../models/Game';
import { IGameStorage } from '../../models/Game';
import GameRepository from '../../repository/Game.repository';
import { IUpdateGameRequest } from '../../request/IUpdateGameRequest';
import GameService from '../../services/Game.service';

export async function show(request: Request, response: Response) {
    const gameId = request.params.id;
    const game = await Game.findOne({ where: { gameId } });
    if (!game) return response.sendStatus(404);

    response.json(game);
}

export async function all(request: Request, response: Response) {
    const games = await Game.find();

    response.json(games);
}

export async function update(request: Request, response: Response) {
    const gameId = request.params.id;
    const params = request.body as IUpdateGameRequest;

    const game = await Game.findOne({ where: { gameId } });
    if (!game) return response.sendStatus(404);

    Object.assign(game, params);
    await game.save();

    response.json(game);
}

export async function latest(request: Request, response: Response) {
    const gameRepository = getCustomRepository(GameRepository);
    const game = await gameRepository.latest();
    if (!game) return response.sendStatus(404);

    response.json(game);
}

export async function create(request: Request, response: Response) {
    const { season, mode, videoUrl, storage } = request.body;
    const game = new Game();

    game.season = season;
    game.mode = mode;
    game.videoUrl = videoUrl;
    game.storage = {
        mode,
        title: storage.title,
        objectives: storage.objectives || {},
        players: storage.players || {},
    } as IGameStorage;

    await game.save();

    response.json(game);
}

export async function findAllBySeason(request: Request, response: Response) {
    const season = request.params.season;
    const gameRepository = await getCustomRepository(GameRepository);
    const games = await gameRepository.findAllBySeason(season);

    response.json(games);
}

export async function end(request: Request, response: Response) {
    const gameId = request.params.id;
    const gameRepository = getCustomRepository(GameRepository);
    const game = await gameRepository.findOne(gameId);
    if (!game) return response.sendStatus(404);

    // Get winner
    // const winner = await TeamRepository.byId(request.query.winner);

    // await GameService.backupGame(game);
    // await GameService.endGame(game, winner);

    // response.json({ game, winner });
}
