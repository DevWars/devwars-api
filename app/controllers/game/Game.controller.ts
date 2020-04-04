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
import { isNil } from 'lodash';
import { DATABASE_MAX_ID } from '../../constants';
import { parseIntWithDefault, parseBooleanWithDefault } from '../../../test/helpers';
import UserRepository from '../../repository/User.repository';
import GameApplicationRepository from '../../repository/GameApplication.repository';

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
        schedule: game.schedule?.id || null,
    };
}

export async function show(request: IGameRequest, response: Response) {
    const includePlayers = parseBooleanWithDefault(request.query.players, false);
    const game = flattenGame(request.game);

    if (includePlayers && !isNil(game.players)) {
        const userRepository = getCustomRepository(UserRepository);
        const players = await userRepository.findByIds(Object.keys(game.players), {
            relations: ['connections'],
        });

        for (const player of players) {
            game.players[player.id] = Object.assign(player, game.players[player.id]);
        }
    }

    return response.json(game);
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
        objectives: gameRequest.objectives || game.storage?.objectives,
        teams: gameRequest.teams || game.storage?.teams,
        meta: gameRequest.meta || game.storage?.meta,
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
    const game = await gameRepository.active(['schedule']);

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
    const season = parseIntWithDefault(request.params.season, null, 1, DATABASE_MAX_ID);

    if (isNil(season)) throw new ApiError({ code: 400, error: 'Invalid season id provided.' });

    const gameRepository = getCustomRepository(GameRepository);
    const games = await gameRepository.findAllBySeason(Number(season));

    response.json(games.map((game) => flattenGame(game)));
}

/**
 * @api {post} /games/:gameId/auto-assign Auto assign the players to the teams.
 * @apiDescription Auto assigns the players to the given teams based on the
 * players wins, loses, last played.
 * @apiVersion 1.0.0
 * @apiName AutoAssignPLayersToGame
 * @apiGroup Games
 *
 * @apiParam {number} gameId The id of the game players are being auto-assigned.
 *
 * @apiSuccess {any} The players have been auto assigned to the game.
 * @apiSuccessExample Success-Response: HTTP/1.1 200 OK
 * {
 *  ...
 *  }
 *
 * @apiError GameIdNotDefined Invalid game id provided.
 * @apiError PlayersAlreadyAssigned The game already has players assigned.
 * @apiError GameScheduleDoesNotExist A game does not exist by the provided game id.
 * @apiError GameNotActive The requesting auto assign game is not in a active state.
 */
export async function autoAssignPlayers(request: IRequest & IGameRequest, response: Response) {
    if (request.game?.status !== GameStatus.ACTIVE)
        throw new ApiError({
            error: 'You cannot balance a game that is not active.',
            code: 400,
        });

    if (_.isNil(request.game.schedule))
        throw new ApiError({
            error: 'The game does not have a corresponding game schedule.',
            code: 404,
        });

    if (_.size(request.game.storage.editors) > 0)
        throw new ApiError({
            error: 'The game already has assigned players, auto-assignment cannot occur.',
            code: 400,
        });

    // Grab a list of all the related game applications for the given game.
    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
    const applications = await gameApplicationRepository.findBySchedule(request.game.schedule, [
        'user',
        'user.stats',
        'user.gameStats',
    ]);
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
