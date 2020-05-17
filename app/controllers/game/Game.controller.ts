import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';

import * as _ from 'lodash';

import Game, { GameMode } from '../../models/Game';
import GameRepository from '../../repository/Game.repository';

import { UpdateGameRequest } from '../../request/UpdateGameRequest';
import { GameRequest, AuthorizedRequest, CreateGameRequest } from '../../request/IRequest';
import { GameStatus } from '../../models/Game';
import GameService from '../../services/Game.service';
import ApiError from '../../utils/apiError';
import { DATABASE_MAX_ID } from '../../constants';
import {
    parseIntWithDefault,
    parseBooleanWithDefault,
    parseEnumFromValue,
    parseStringWithDefault,
} from '../../../test/helpers';
import GameApplicationRepository from '../../repository/GameApplication.repository';
import PaginationService from '../../services/pagination.service';
import { GameStorage } from '../../types/game';

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
        startTime: game.startTime,
    };
}

export async function show(request: GameRequest, response: Response) {
    const gameId = parseIntWithDefault(request.params.game, null, 1, DATABASE_MAX_ID);
    const includePlayers = parseBooleanWithDefault(request.query.players, false);

    if (_.isNil(gameId)) throw new ApiError({ code: 400, error: 'Invalid game id provided.' });

    const gameRepository = getCustomRepository(GameRepository);
    let findGameQuery = gameRepository.createQueryBuilder('game').where('game.id = :gameId', { gameId });

    if (includePlayers) {
        findGameQuery = findGameQuery
            .innerJoin('game.applications', 'game_application')
            .where('game_application.selected = :selected', { selected: true });
    }

    const foundGame = await findGameQuery.getOne();

    return response.json(flattenGame(foundGame));
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
 * @apiError GameIdNotDefined Invalid game id provided.
 * @apiError PlayersAlreadyAssigned The game already has players assigned.
 * @apiError GameNotActive The requesting auto assign game is not in a active state.
 */
export async function autoAssignPlayers(request: AuthorizedRequest & GameRequest, response: Response) {
    if (request.game?.status !== GameStatus.ACTIVE)
        throw new ApiError({
            error: 'You cannot balance a game that is not active.',
            code: 400,
        });

    if (_.size(request.game.storage.editors) > 0)
        throw new ApiError({
            error: 'The game already has assigned players, auto-assignment cannot occur.',
            code: 400,
        });

    // Grab a list of all the related game applications for the given game.
    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
    const applications = await gameApplicationRepository.findByGame(request.game, [
        'user',
        'user.stats',
        'user.gameStats',
    ]);

    // Perform the auto assignment of players based on the applications.
    const updatedGame = GameService.autoAssignPlayersForGame(request.game, applications);
    await updatedGame.game.save();

    return response.status(200).send();
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
