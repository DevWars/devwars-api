import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';

import * as _ from 'lodash';

import Game from '../../models/Game';
import GameRepository from '../../repository/Game.repository';

import { IUpdateGameRequest } from '../../request/IUpdateGameRequest';
import { IGameRequest, IRequest } from '../../request/IRequest';
import { GameStatus } from '../../models/GameSchedule';
import GameService from '../../services/Game.service';
import ApiError from '../../utils/apiError';

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

export async function show(request: IGameRequest, response: Response) {
    return response.json(flattenGame(request.game));
}

export async function all(request: Request, response: Response) {
    const games = await Game.find({ order: { createdAt: 'DESC' } });

    response.json(games.map((game) => flattenGame(game)));
}

export async function update(request: IRequest & IGameRequest, response: Response) {
    const gameRequest = request.body as IUpdateGameRequest;

    const game = request.game;
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

    return response.json(flattenGame(game));
}

/**
 * Returns the latest game that is in the queue for devwars, this could of already occurred but
 * otherwise would be the latest of the games.
 */
export async function latest(request: Request, response: Response) {
    const gameRepository = getCustomRepository(GameRepository);
    const game = await gameRepository.latest();

    // ensure that if we don't have any future games, (meaning that there are no games in the
    // database at all) that we let the user know that no games exist..
    if (_.isNil(game)) throw new ApiError({ code: 404, error: 'Currently no future games exist.' });

    return response.json(flattenGame(game));
}

export async function active(request: Request, response: Response) {
    const gameRepository = getCustomRepository(GameRepository);
    const game = await gameRepository.active();

    if (_.isNil(game)) {
        throw new ApiError({
            error: 'There currently is no active game.',
            code: 404,
        });
    }

    return response.json(flattenGame(game));
}

export async function create(request: IRequest, response: Response) {
    const { season, mode, title, videoUrl, storage } = request.body;

    const game = new Game();

    game.mode = mode;
    game.title = title;
    game.season = season;
    game.videoUrl = videoUrl;
    game.storage = { mode, title, objectives: {}, players: {} };

    if (!_.isNil(storage) && !_.isNil(storage.objectives)) {
        game.storage.objectives = storage.objectives;
    }

    if (!_.isNil(storage) && !_.isNil(storage.players)) {
        game.storage.players = storage.players;
    }

    await game.save();
    return response.status(201).json(flattenGame(game));
}

export async function findAllBySeason(request: Request, response: Response) {
    const season = request.params.season;
    const gameRepository = getCustomRepository(GameRepository);
    const games = await gameRepository.findAllBySeason(Number(season));

    if (!games) return response.sendStatus(404);
    response.json(games.map((game) => flattenGame(game)));
}

export async function activate(request: IRequest & IGameRequest, response: Response) {
    request.game.status = GameStatus.ACTIVE;
    await request.game.save();

    await GameService.sendGameToFirebase(request.game);
    return response.json(flattenGame(request.game));
}

export async function remove(request: IRequest & IGameRequest, response: Response) {
    await request.game.remove();
    return response.json(flattenGame(request.game));
}
