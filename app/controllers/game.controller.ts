import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';

import * as _ from 'lodash';

import Game, { GameMode, GameStatus } from '../models/game.model';
import GameRepository from '../repository/game.repository';

import { parseIntWithDefault } from '../../test/helpers';
import { GameRequest, AuthorizedRequest, CreateGameRequest } from '../request/requests';
import { UpdateGameRequest } from '../request/updateGameRequest';

import { DATABASE_MAX_ID } from '../constants';
import ApiError from '../utils/apiError';

import GameService from '../services/game.service';

/**
 * Takes a game and flattens it within a top level object containing the core
 * properties and all storage related data.
 *
 * @param game The game that is being flattened.
 */
export function flattenGame(game: Game) {
    const picked = _.pick(game, 'id', 'mode', 'season', 'title', 'videoUrl', 'startTime', 'updatedAt', 'createdAt');

    return _.merge(picked, game.storage);
}

export async function show(request: GameRequest, response: Response) {
    return response.json(flattenGame(request.game));
}

export async function getAllGames(request: Request, response: Response) {
    const games = await Game.find({ order: { createdAt: 'DESC' } });

    response.json(games.map((game) => flattenGame(game)));
}

export async function update(request: AuthorizedRequest & GameRequest, response: Response) {
    const gameRequest = request.body as UpdateGameRequest;

    const game = request.game;

    game.startTime = gameRequest.startTime || game.startTime;
    game.mode = gameRequest.mode || game.mode || GameMode.Classic;
    game.videoUrl = gameRequest.videoUrl;
    game.title = gameRequest.title || '';
    game.storage = {
        ...game.storage,
        objectives: gameRequest.objectives || game.storage?.objectives,
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

/**
 * @api {post} /games/ Create a game with the given properties.
 * @apiDescription Creates a new game based on the properties.
 * @apiName CreateNewGame
 * @apiVersion 1.0.0
 * @apiGroup Games
 *
 * @apiParam {number {0..}} schedule The id of the related game schedule.
 * @apiParam {number {1..3}} season The season the game is being created for.
 * @apiParam {string="Zen Garden","Classic","Blitz"} mode The mode the game will be playing.
 * @apiParam {string {5..124}} title The title of the game.
 * @apiParam {string} [videoUrl] The optional video url.
 * @apiParam {number=0,1,2} [status] The optional game status.
 * @apiParam {object} [storage] The optional additional storage of the game.
 * @apiParam {datetime} storage.startTime The start time of the game.
 * @apiParam {string} storage.templates The optional templates for the game.
 * @apiParam {string} storage.templates.html The optional html template.
 * @apiParam {string} storage.templates.css The optional css template.
 * @apiParam {string} storage.templates.js The optional js template.
 * @apiParam {object} storage.objectives The objectives that will be sent to the game server.
 * @apiParam {number} storage.objectives.id The objective id.
 * @apiParam {string} storage.objectives.description The objective description.
 * @apiParam {boolean} storage.objectives.isBonus If the given game objective is a bonus objective.
 *
 * @apiParamExample {json} Request-Example:
 * {
 *   "schedule": 51,
 *   "season": 3,
 *   "mode": "Classic",
 *   "title:": "Game title",
 *   "status": 0,
 *   "storage": {
 *     "templates": {
 *       "html": "<body></body>",
 *       "css": "body { color: white; }",
 *       "js": "console.log('hi')"
 *     },
 *     "startTime": "2020-04-30T12:33:00.000Z",
 *     "objectives": {
 *       "1": {
 *         "id": 1,
 *         "description": "1",
 *         "isBonus": false
 *       }
 *     }
 *   }
 * }
 *
 * @apiSuccess {Game} game The newly created game object.
 * @apiSuccessExample Success-Response: 200 OK
 * {
 *   "mode": "Classic",
 *   "teams": {
 *     "0": {
 *       "id": 0,
 *       "name": "blue"
 *     },
 *     "1": {
 *       "id": 1,
 *       "name": "red"
 *     }
 *   },
 *   "title": "1111111",
 *   "editors": {},
 *   "players": {},
 *   "startTime": "2020-04-30T12:33:00.000Z",
 *   "templates": {
 *     "html": "<body></body>",
 *     "css": "body { color: white; }",
 *     "js": "console.log('hi')"
 *   },
 *   "objectives": {
 *     "1": {
 *       "id": 1,
 *       "isBonus": false,
 *       "description": "1"
 *     }
 *   },
 *   "id": 51,
 *   "createdAt": "2020-04-16T12:34:29.856Z",
 *   "updatedAt": "2020-04-16T12:34:29.856Z",
 *   "season": 3,
 *   "videoUrl": null,
 *   "status": 0,
 *   "schedule": 51
 * }
 *
 * @apiError MissingDefinedProperties The request is missing required properties to create games.
 * @apiError ScheduleDoesNotExist The given schedule for the game does not exist.
 * @apiError ScheduleIsNotActive The given schedule is not active.
 */
export async function createNewGame(request: CreateGameRequest, response: Response) {
    const { season, mode, title, templates, videoUrl, startTime, status } = request.body;

    const game = new Game(season, mode, title, videoUrl, status, startTime, {
        editors: {},
        templates,
    });

    await game.save();

    return response.status(201).json(flattenGame(game));
}

export async function activate(request: AuthorizedRequest & GameRequest, response: Response) {
    request.game.status = GameStatus.ACTIVE;
    await request.game.save();

    await GameService.sendGameToFirebase(request.game);
    return response.json(flattenGame(request.game));
}

export async function remove(request: AuthorizedRequest & GameRequest, response: Response) {
    await request.game.remove();
    return response.json(flattenGame(request.game));
}
