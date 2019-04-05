import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';

import Game from '../../models/Game';
import GameRepository from '../../repository/Game.repository';

import { IUpdateGameRequest } from '../../request/IUpdateGameRequest';
import { GameStatus } from '../../models/GameSchedule';
import GameService from '../../services/Game.service';

export function flattenGame(game: Game) {
    return {
        ...game.storage,
        id: game.id,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        season: game.season,
        mode: game.mode,
        videoUrl: game.videoUrl,
        status: game.status, // TEMPORARY
    };
}

export async function show(request: Request, response: Response) {
    const gameId = request.params.id;
    const game = await Game.findOne(gameId);
    if (!game) return response.sendStatus(404);

    response.json(flattenGame(game));
}

export async function all(request: Request, response: Response) {
    const games = await Game.find({ order: { createdAt: 'DESC' } });

    response.json(games.map((game) => flattenGame(game)));
}

export async function update(request: Request, response: Response) {
    const gameId = request.params.id;
    const gameRequest = request.body as IUpdateGameRequest;

    const game = await Game.findOne(gameId);
    if (!game) return response.sendStatus(404);

    game.mode = gameRequest.mode;
    game.videoUrl = gameRequest.videoUrl;
    game.storage = {
        ...game.storage,
        title: gameRequest.title,
        mode: gameRequest.mode,
        objectives: gameRequest.objectives,
    };

    await game.save();

    if (game.status === GameStatus.ACTIVE) {
        await GameService.sendGameToFirebase(game);
    }

    response.json(flattenGame(game));
}

export async function latest(request: Request, response: Response) {
    const gameRepository = getCustomRepository(GameRepository);
    const game = await gameRepository.latest();
    if (!game) return response.sendStatus(404);

    response.json(flattenGame(game));
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
    };

    await game.save();

    response.status(201).json(flattenGame(game));
}

export async function findAllBySeason(request: Request, response: Response) {
    const season = request.params.season;
    const gameRepository = await getCustomRepository(GameRepository);
    const games = await gameRepository.findAllBySeason(season);

    if (!games) return response.sendStatus(404);
    response.json(games.map((game) => flattenGame(game)));
}

export async function activate(request: Request, response: Response) {
    const gameId = request.params.id;

    const game = await Game.findOne(gameId);
    if (!game) return response.sendStatus(404);

    game.status = GameStatus.ACTIVE;
    await game.save();

    await GameService.sendGameToFirebase(game);

    response.json(flattenGame(game));
}
