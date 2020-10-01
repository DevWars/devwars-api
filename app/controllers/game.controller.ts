import { Request, Response } from 'express';

import * as _ from 'lodash';

import Game, { GameMode, GameStatus } from '../models/game.model';

import { GameRequest, AuthorizedRequest, CreateGameRequest } from '../request/requests';
import { UpdateGameRequest } from '../request/updateGameRequest';
import ApiError from '../utils/apiError';

import GameService from '../services/game.service';
import { parseStringWithDefault, parseIntWithDefault, parseEnumFromValue } from '../../test/helpers';
import { getCustomRepository } from 'typeorm';
import PaginationService from '../services/pagination.service';
import { DATABASE_MAX_ID } from '../constants';
import GameRepository from '../repository/game.repository';
import GameSourceRepository from '../repository/gameSource.repository';

/**
 * Takes a game and flattens it within a top level object containing the core
 * properties and all storage related data.
 *
 * @param game The game that is being flattened.
 */
export function flattenGame(game: Game) {
    const picked = _.pick(
        game,
        'id',
        'mode',
        'season',
        'status',
        'title',
        'videoUrl',
        'startTime',
        'updatedAt',
        'createdAt'
    );

    return _.merge(picked, game.storage);
}

/**
 * @api {get} /users Request all games with paging.
 * @apiName GetGames
 * @apiGroup Games
 *
 * @apiParam {string} limit The number of users to gather from the offset. (limit: 100)
 * @apiParam {string} offset The offset of which place to start gathering users from.
 *
 * @apiSuccess {json} Users The users within the limit and offset.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *   "data": [
 *     {
 *     ...
 *     }
 *   ],
 *  "pagination": {
 *      "next": "bmV4dF9fQWxleGFubmVfQWx0ZW53ZXJ0aA==",
 *      "previous": null
 *  }
 * }
 */
export async function getAllGames(request: Request, response: Response) {
    const games = await Game.find({ order: { createdAt: 'DESC' } });

    response.json(games.map((game) => flattenGame(game)));
}

/**
 * @api {get} /games?season=:season&status=:status Get games
 * @apiDescription Gets all the given games.
 * format.
 * @apiName GetGames
 * @apiVersion 1.0.0
 * @apiGroup Games
 *
 * @apiParam {number {1..100}} [first=20] The number of games to return for the given page.
 * @apiParam {number {0..}} [after=0] The point of which the games should be gathered after.
 * @apiParam {string=scheduled,active,ended} [status] The optional game status to filter by.
 * @apiParam {number {1..3}} [season] The optional specified season which the games are related too.
 *
 * @apiSuccess {Game[]} data The related games based on the provided season and page range.
 * @apiSuccess {object} pagination The paging information to continue forward or backward.
 * @apiSuccess {string} pagination.next The next page in the paging of the data.
 * @apiSuccess {string} pagination.previous The previous page in the paging of the data.
 *
 * @apiSuccessExample Success-Response: HTTP/1.1 200 OK
 * {
 *   "data": [
 *     { ... }
 *   ],
 *   "pagination": {
 *     "next": "bmV4dF9fODM=",
 *      "previous": null
 *   }
 * }
 *
 * @apiError {error} InvalidSeasonId The given season <code>id</code> provided is not valid, e.g
 * empty or not a valid number.
 */
export async function gatheringAllGamesWithPaging(request: Request, response: Response) {
    const { after, before, first, status: queryStatus, season } = request.query;

    const status = parseStringWithDefault(queryStatus, null);

    const params = {
        first: parseIntWithDefault(first, 20, 1, 100),
        season: parseIntWithDefault(season, null, 1, DATABASE_MAX_ID),
        status: parseEnumFromValue(GameStatus, _.isNil(status) ? status : status.toUpperCase(), null),
    };

    const gameRepository = getCustomRepository(GameRepository);
    const where: any = {};

    if (!_.isNil(params.status)) where.status = params.status;
    if (!_.isNil(params.season)) where.season = params.season;

    const result: any = await PaginationService.pageRepository<Game>(
        gameRepository,
        params.first,
        after as string,
        before as string,
        'id',
        true,
        [],
        where
    );

    result.data = _.map(result.data, (game) => flattenGame(game));
    return response.json(result);
}

/**
 * @api {get} /games/:game Get game by id.
 * @apiName GetGame
 * @apiGroup Games
 *
 * @apiParam {Number} game  The games id being gathered.
 *
 * @apiSuccess {number} id
 * @apiSuccess {string} mode
 * @apiSuccess {number} season
 * @apiSuccess {string} status
 * @apiSuccess {string} title
 * @apiSuccess {string} videoUrl
 * @apiSuccess {date} startTime
 * @apiSuccess {object} templates
 * @apiSuccess {object} objectives
 * @apiSuccess {object} meta
 */
export async function getGameById(request: GameRequest, response: Response) {
    return response.json(flattenGame(request.game));
}

/**
 * @api {patch} /games/:game Update game by id.
 * @apiName UpdateGame
 * @apiGroup Games
 *
 * @apiParam {Number} game  The games id being gathered.
 */
export async function updateGameById(request: AuthorizedRequest & GameRequest, response: Response) {
    const gameRequest = request.body as UpdateGameRequest;

    const game = request.game;

    game.startTime = gameRequest.startTime || game.startTime;
    game.status = gameRequest.status || game.status;
    game.title = gameRequest.title || '';
    game.season = gameRequest.season || game.season;
    game.mode = gameRequest.mode || game.mode || GameMode.Classic;
    game.videoUrl = gameRequest.videoUrl;

    game.storage = {
        ...game.storage,
        objectives: gameRequest.objectives || game.storage?.objectives,
        templates: gameRequest.templates || game.storage?.templates,
        meta: gameRequest.meta || game.storage?.meta,
    };

    await game.save();

    if (game.status === GameStatus.ACTIVE) {
        await GameService.sendGameToFirebase(game);
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
        objectives: {},
        templates,
    });

    await game.save();

    return response.status(201).json(flattenGame(game));
}
/**
 * @api {post} /games/:game/actions/activate Activates a game by a given id.
 * @apiVersion 1.0.0
 * @apiName ActivateGame
 * @apiDescription Activates a game by the given id
 *
 * @apiGroup LiveGame
 *
 * @apiParam {number} game The id of the game.
 *
 * @apiSuccessExample Success-Response: HTTP/1.1 200 OK
 * { }
 *
 * @apiError GameAlreadyEnded The given game has already been activated.
 */
export async function activateById(request: AuthorizedRequest & GameRequest, response: Response) {
    if (request.game.status === GameStatus.ACTIVE) {
        throw new ApiError({
            message: 'The specified game is already activated.',
            code: 409,
        });
    }

    request.game.status = GameStatus.ACTIVE;
    await request.game.save();

    await GameService.sendGameToFirebase(request.game);
    return response.json(flattenGame(request.game));
}

/**
 * @api {delete} /games/:game Deletes the game from the system
 * @apiName DeleteGameById
 * @apiGroup Games
 * @apiPermission admin
 *
 * @apiParam {Number} game The given game being removed.
 */
export async function deleteGameById(request: AuthorizedRequest & GameRequest, response: Response) {
    const gameSourceRepository = getCustomRepository(GameSourceRepository);
    await gameSourceRepository.deleteByGame(request.game);

    await request.game.remove();
    return response.json(flattenGame(request.game));
}

/**
 * @api {get} /games/:game/source Get all the source of the game after completion (e.g the source code)
 * @apiName GetGameSourceByGameId
 * @apiGroup Games
 *
 * @apiParam {Number} game The given game source being gathered.
 */
export async function getGamesRelatedSourceDetails(request: GameRequest, response: Response) {
    const gameSourceRepository = getCustomRepository(GameSourceRepository);
    const sources = await gameSourceRepository.findByGame(request.game);

    return response.json(sources);
}
