import { getCustomRepository } from 'typeorm';
import { Response } from 'express';
import * as _ from 'lodash';

import { IGameRequest, IRequest, IScheduleRequest } from '../../request/IRequest';
import { sendGameApplicationApplyingEmail, SendGameApplicationResignEmail } from '../../services/Mail.service';

import GameApplicationRepository from '../../repository/GameApplication.repository';
import GameScheduleRepository from '../../repository/GameSchedule.repository';
import UserRepository from '../../repository/User.repository';

import GameApplication from '../../models/GameApplication';
import User, { UserRole } from '../../models/User';

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
 * @apiError GameScheduleDoesNotExist A game schedule does not exist by the provided game id.
 */
export async function getCurrentUserGameApplications(request: IRequest, response: Response) {
    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
    const applications = await gameApplicationRepository.findByUser(request.user);

    return response.json(applications);
}

/**
 * @api {post} /applications/schedule/:scheduleId Applies the current user to the scheduled game.
 * @apiDescription Applies the current authenticated user to the given schedule by creating a game
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
 * @apiError GameScheduleDoesNotExist A game schedule does not exist by the provided game id.
 */
export async function applyToSchedule(request: IRequest & IScheduleRequest, response: Response) {
    const application = new GameApplication(request.schedule, request.user);
    await application.save();

    await sendGameApplicationApplyingEmail(application);
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
 * @apiParam {number} ScheduleId The id of the schedule being resigned from.
 *
 * @apiSuccess OK
 *
 * @apiError ScheduleIdNotDefined Invalid schedule id provided.
 * @apiError GameScheduleDoesNotExist A game schedule does not exist by the provided game id.
 */
export async function resignFromSchedule(request: IRequest & IScheduleRequest, response: Response) {
    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);

    const application = await gameApplicationRepository.findByUserAndSchedule(request.user, request.schedule);
    const { id: applicationId } = application;

    if (_.isNil(application)) {
        const { username } = request.user;
        const { id } = request.schedule;

        return response.status(404).json({
            error: `No game application exists for schedule ${id} by user ${username}`,
        });
    }

    await application.remove();
    await SendGameApplicationResignEmail(application);

    return response.send({ application: applicationId });
}

/**
 * @api {get} /applications/schedule/:scheduleId Gather a list of users applications by a schedule.
 * @apiDescription Finds a list of game applications for a given game schedule, sending back the
 * list of users information.
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
 * @apiError GameScheduleDoesNotExist A game schedule does not exist by the provided game id.
 */
export async function findApplicationsBySchedule(request: IScheduleRequest, response: Response) {
    const userRepository = getCustomRepository(UserRepository);
    let users = await userRepository.findApplicationsBySchedule(request.schedule);

    const sanitizationFields = ['updatedAt', 'createdAt', 'lastSignIn', 'email'];
    users = users.map((app: User) => app.sanitize(...sanitizationFields));

    return response.json(users);
}

/**
 * @api {get} /applications/game/:gameId Gather a list of users applications by a game.
 * @apiDescription Finds a list of game applications for a given game, sending back the list of
 * users information.
 * @apiVersion 1.0.0
 * @apiName GameApplicationsByGame
 * @apiGroup Applications
 *
 * @apiParam {number} GameId The id of the given game to gather applications from.
 *
 * @apiSuccess {User[]} Applications A list of users applications for a given game id.
 * @apiSuccessExample Success-Response: HTTP/1.1 200 OK
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
 * @apiError GameDoesNotExist A game does not exist by the provided game id.
 * @apiError GameScheduleDoesNotExist A game schedule does not exist by the provided game id.
 *
 */
export async function findUserApplicationsByGame(request: IGameRequest, response: Response) {
    const userRepository = getCustomRepository(UserRepository);
    let users = (await userRepository.findApplicationsBySchedule(request.game.schedule)) || [];

    const sanitizationFields = ['updatedAt', 'createdAt', 'lastSignIn', 'email'];
    users = users.map((app) => app.sanitize(...sanitizationFields));

    return response.json(users);
}

export async function createGameSchedule(request: IRequest & IGameRequest, response: Response) {
    const schedule = request.game.schedule;

    if (_.isNil(schedule)) {
        return response.status(404).send({
            error: 'A game schedule does not exist for the given id.',
        });
    }

    const { username } = request.params;

    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findByUsername(username);

    if (_.isNil(user)) {
        return response.status(404).send({
            error: `A user does not exist by the provided username '${username}'`,
        });
    }

    const application = new GameApplication(schedule, user);
    await application.save();

    return response.json(application);
}
