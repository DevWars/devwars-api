import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';

import GameApplicationFactory from '../../factory/GameApplication.factory';
import GameScheduleRepository from '../../repository/GameSchedule.repository';
import GameApplicationRepository from '../../repository/GameApplication.repository';
import GameRepository from '../../repository/Game.repository';
import UserRepository from '../../repository/User.repository';

import { AuthService } from '../../services/Auth.service';
import GameApplication from '../../models/GameApplication';
import { IRequest } from '../../request/IRequest';
import * as _ from 'lodash';

/**
 * @api {get} /mine Returns a list of game applications currently registered on.
 * @apiDescription Gathers a list of game applications for the current authenticated user in which
 * the current user is registered with.
 * @apiVersion 1.0.0
 * @apiName GameApplicationsForCurrentUser
 * @apiGroup Applications
 *
 * @apiSuccess {GameApplication[]} GameApplications A list of game applications for current user.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * [
 *   {
 *     "id": 37,
 *     "updatedAt": "2019-10-04T16:28:54.182Z",
 *     "createdAt": "2019-10-04T16:28:54.182Z",
 *     "schedule": {
 *       "id": 1,
 *       "updatedAt": "2019-10-04T16:10:24.334Z",
 *       "createdAt": "2019-10-04T16:10:24.334Z",
 *       "startTime": "2020-03-20T03:37:46.716Z",
 *       "status": 2,
 *       "setup": {
 *         "mode": "Classic",
 *         "title": "capacitor",
 *         "objectives": {
 *           "1": {
 *             "id": 1,
 *             "isBonus": false,
 *             "description": "Id modi itaque quisquam non ea nam animi soluta maiores."
 *           },
 *           "2": {
 *             "id": 2,
 *             "isBonus": false,
 *             "description": "Veritatis porro ducimus nam asperiores id."
 *           },
 *           "3": {
 *             "id": 3,
 *             "isBonus": false,
 *             "description": "Nihil deleniti voluptatum ea."
 *           },
 *           "4": {
 *             "id": 4,
 *             "isBonus": true,
 *             "description": "Atque fugiat cupiditate consequuntur repellendus ut."
 *           }
 *         }
 *       }
 *     }
 *   }
 * ]
 *
 * @apiError ScheduleIdNotDefined Invalid schedule id provided.
 * @apiError GameScheduleDoesNotExist A game schedule does not exist by the provided gam id.
 */
export async function mine(request: IRequest, response: Response) {
    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
    const applications = await gameApplicationRepository.findByUser(request.user);

    response.json(applications);
}

/**
 * @api {post} /applications/schedule/:scheduleId Applys the current user to the scheduled game.
 * @apiDescription Applys the current authenticated user to the given schedule by creating a game
 * application. The game application is return returned to the applying user. Containing the
 * schedule and user.
 * @apiVersion 1.0.0
 * @apiName GameApplicationApplyBySchedule
 * @apiGroup Applications
 *
 * @apiParam {number} ScheduleId The id of the schedule being applied too.
 *
 * @apiSuccess {GameApplication} schedule The application of the game applied too.
 * @apiSuccessExample Success-Response: HTTP/1.1 200 OK
 * {
 *   "schedule": {"id": 1, "updatedAt": "2019-10-04T16:10:24.334Z", "createdAt":
 *     "2019-10-04T16:10:24.334Z", "startTime": "2020-03-20T03:37:46.716Z", "status": 2, "setup":
 *     {"mode": "Classic", "title": "capacitor", "objectives": {"1": {"id": 1, "isBonus": false,
 *     "description": "Id modi itaque quisquam non ea nam animi soluta maiores."
 *         },
 *         "2": {
 *           "id": 2,
 *           "isBonus": false,
 *           "description": "Veritatis porro ducimus nam asperiores id."
 *         },
 *         "3": {
 *           "id": 3,
 *           "isBonus": false,
 *           "description": "Nihil deleniti voluptatum ea."
 *         },
 *         "4": {
 *           "id": 4,
 *           "isBonus": true,
 *           "description": "Atque fugiat cupiditate consequuntur repellendus ut."
 *         }
 *       }
 *     }
 *   },
 *   "user": {"id": 3, "updatedAt": "2019-10-04T16:10:49.974Z", "createdAt":
 *     "2019-10-04T16:10:21.748Z", "lastSignIn": "2019-10-04T16:10:49.969Z", "email":
 *     "Thora32@yahoo.com", "username": "test-user", "role": "USER", "avatarUrl":
 *     "http://lorempixel.com/640/480/city"
 *   },
 *   "id": 39, "updatedAt": "2019-10-04T16:40:01.906Z", "createdAt": "2019-10-04T16:40:01.906Z"
 * }
 *
 * @apiError ScheduleIdNotDefined Invalid schedule id provided.
 * @apiError GameScheduleDoesNotExist A game schedule does not exist by the provided gam id.
 */
export async function apply(request: IRequest, response: Response) {
    const scheduleId = request.params.schedule;

    // Ensure that if the schedule id route was not setup correctly and the given id was null or
    // undefined, return out and warn the user of the given action.
    if (_.isNil(scheduleId)) return response.status(400).json({ error: 'Invalid schedule id provided.' });

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(scheduleId);

    // If a schedule does not exit by the provided id, ensure that we let the user.
    if (_.isNil(schedule))
        return response.sendStatus(404).json({
            error: 'A game schedule does not exist for the given id.',
        });

    const application = await GameApplicationFactory.withScheduleAndUser(schedule, request.user).save();

    // Ensure to sanitize the requesting user, removing the token and password from the user object
    // before returning it to the requesting user.
    application.user = AuthService.sanitizeUser(application.user);

    return response.json(application);
}

/**
 * @api {delete} /applications/schedule/:scheduleId Resigns the user from a given game schedule.
 * @apiDescription Resigns / removes the current authenticated users game application for a given
 * schedule, removing there application completely.
 * @apiVersion 1.0.0
 * @apiName GameApplicationResignBySchedule
 * @apiGroup Applications
 *
 *  @apiParam {number} ScheduleId The id of the schedule being resigned from.
 *
 * @apiSuccess OK
 *
 * @apiError ScheduleIdNotDefined Invalid schedule id provided.
 * @apiError GameScheduleDoesNotExist A game schedule does not exist by the provided gam id.
 */
export async function resign(request: IRequest, response: Response) {
    const scheduleId = request.params.schedule;

    // Ensure that if the schedule id route was not setup correctly and the given id was null or
    // undefined, return out and warn the user of the given action.
    if (_.isNil(scheduleId)) return response.status(400).json({ error: 'Invalid schedule id provided.' });

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(scheduleId);

    // If a schedule does not exit by the provided id, ensure that we let the user.
    if (_.isNil(schedule))
        return response.sendStatus(404).json({
            error: 'A game schedule does not exist for the given id.',
        });

    // Perform the deletion of the record that links a given user to a given game, removing the
    // users application. This will not care if the given user does not have a application already
    // the result will be the same.
    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
    await gameApplicationRepository.delete({ user: request.user, schedule });

    return response.send();
}

/**
 * @api {get} /applications/schedule/:scheduleId Gather a list of users applications by a schedule.
 * @apiDescription Finds a list of game applications for a given game schedule, sending back the
 * list of users information for a given game, this will  be used for the assignment process of a
 * given game. The game must exist for any game applications to also exist.
 * @apiVersion 1.0.0
 * @apiName GameApplicationsBySchedule
 * @apiGroup Applications
 *
 * @apiParam {number} ScheduleId The id of the given schedule to gather applications from.
 *
 * @apiSuccess {User[]} Applications A list of users applications for a given game schedule id.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * [{
 *      "id": 1,
 *      "username": "test-admin",
 *      "role": "ADMIN",
 *      "avatarUrl": "http://lorempixel.com/640/480/animals"
 *  },
 *  {
 *      "id": 3,
 *      "username": "test-user",
 *      "role": "USER",
 *      "avatarUrl": "http://lorempixel.com/640/480/city"
 *  }]
 *
 * @apiError ScheduleIdNotDefined Invalid schedule id provided.
 * @apiError GameScheduleDoesNotExist A game schedule does not exist by the provided gam id.
 */
export async function findBySchedule(request: Request, response: Response) {
    const scheduleId = request.params.schedule;

    // Ensure that if the schedule id route was not setup correctly and the given id was null or
    // undefined, return out and warn the user of the given action.
    if (_.isNil(scheduleId)) return response.status(400).json({ error: 'Invalid schedule id provided.' });

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(scheduleId);

    // If a schedule does not exit by the provided id, ensure that we let the user.
    if (_.isNil(schedule))
        return response.sendStatus(404).json({
            error: 'A game schedule does not exist for the given id.',
        });

    const userRepository = getCustomRepository(UserRepository);
    let applications = await userRepository.findApplicationsBySchedule(schedule);

    // Once we get the applications back from the given schedule, all private user information will
    // exist on the objects. Mapping through the sanitizer will remove key information and the
    // additional provided fields.
    const sanizationFields = ['updatedAt', 'createdAt', 'lastSignIn', 'email'];
    applications = applications.map((user) => AuthService.sanitizeUser(user, sanizationFields));

    response.json(applications);
}

/**
 * @api {get} /applications/game/:gameId Gather a list of users applications by a game.
 * @apiDescription Finds a list of game applications for a given game, sending back the list of
 * users information for a given game, this will  be used for the assignment process of a given
 * game. The game must exist for any game applications to also exist.
 * @apiVersion 1.0.0
 * @apiName GameApplicationsByGame
 * @apiGroup Applications
 *
 * @apiParam {number} GameId The id of the given game to gather applications from.
 *
 * @apiSuccess {User[]} Applications A list of users applications for a given game id.
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * [{
 *      "id": 1,
 *      "username": "test-admin",
 *      "role": "ADMIN",
 *      "avatarUrl": "http://lorempixel.com/640/480/animals"
 *  },
 *  {
 *      "id": 3,
 *      "username": "test-user",
 *      "role": "USER",
 *      "avatarUrl": "http://lorempixel.com/640/480/city"
 *  }]
 *
 * @apiError GameIdNotDefined Invalid game id provided.
 * @apiError GameDoesNotExist A game does not exist by the provided gam id.
 * @apiError GameScheduleDoesNotExist A game schedule does not exist by the provided gam id.
 *
 */
export async function findByGame(request: Request, response: Response) {
    const gameId = request.params.game;

    // Ensure that if the game id route was not setup correctly and the given game id was null or
    // undefined, return out and warn the user of the given action.
    if (_.isNil(gameId)) return response.status(400).json({ error: 'Invalid game id provided.' });

    const gameRepository = getCustomRepository(GameRepository);
    const game = await gameRepository.findOne(gameId);

    // If a game does not exit by the provided id, ensure that we let the current moderator /
    // administrator aware. Likely to occur with out to date UI or direct api queries.
    if (_.isNil(game)) return response.status(404).json({ error: 'A game does not exist by the provided game id.' });

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findByGame(game);

    if (_.isNil(schedule))
        return response.sendStatus(404).json({
            error: 'A game schedule does not exist for the given id.',
        });

    const userRepository = getCustomRepository(UserRepository);
    let applications = (await userRepository.findApplicationsBySchedule(schedule)) || [];

    // Once we get the applications back from the given schedule, all private user information will
    // exist on the objects. Mapping through the sanitizer will remove key information and the
    // additional provided fields.
    const sanizationFields = ['updatedAt', 'createdAt', 'lastSignIn', 'email'];
    applications = applications.map((user) => AuthService.sanitizeUser(user, sanizationFields));

    response.json(applications);
}

export async function create(request: IRequest, response: Response) {
    const gameId = request.params.game;
    const username = request.params.username;

    const gameRepository = getCustomRepository(GameRepository);
    const game = await gameRepository.findOne(gameId);

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findByGame(game);

    if (_.isNil(schedule)) return response.sendStatus(404);

    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findByUsername(username);

    if (_.isNil(user)) return response.sendStatus(404);

    const application = new GameApplication();
    application.schedule = schedule;
    application.user = user;

    await application.save();

    response.json(application);
}
