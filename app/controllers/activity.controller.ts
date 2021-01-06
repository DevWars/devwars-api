import { Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import ActivityRepository from '../repository/activity.repository';

import { parseIntWithDefault } from '../utils/helpers';
import { UserRequest } from '../request/requests';
import { DATABASE_MAX_ID } from '../constants';
import ApiError from '../utils/apiError';

/******************************
 *  Activities
 ******************************/

/**
 * @api {get} users/:user/activities Get all users activities
 * @apiName GetUsersActivities
 * @apiGroup Activity
 * @apiPermission moderator, owner
 *
 * @apiSuccess {Activity[]} Activities The users activities.
 *
 * @apiSuccess {Date} activity.createdAt       Time created
 * @apiSuccess {Date} activity.updatedAt       Time updated
 * @apiSuccess {String} activity.description   Description of activity
 * @apiSuccess {Number} activity.coins         Amount of coins rewarded
 * @apiSuccess {Number} activity.xp            Amount of XP rewarded
 * @apiSuccess {Number} activity.userId        User ID activity belongs to
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [
 *       {
 *         "id": 1,
 *         "createdAt": "2018-10-21T21:45:45.000Z",
 *         "updatedAt": "2018-10-21T21:45:45.000Z",
 *         "description": "You validated your email"
 *         "coins": 100,
 *         "xp": 0,
 *         "userId": 1
 *       },
 *       {
 *         "id": 2,
 *         "createdAt": "2018-10-21T21:45:45.000Z",
 *         "updatedAt": "2018-10-21T21:45:45.000Z",
 *         "description": "Connected your Twitch account"
 *         "coins": 500,
 *         "xp": 10,
 *         "userId": 1
 *       }
 *     ]
 */
export async function gatherAllUsersActivitiesById(request: UserRequest, response: Response) {
    const activityRepository = getCustomRepository(ActivityRepository);
    const activities = await activityRepository.find({ user: request.boundUser });

    return response.json(activities);
}

/**
 * @api {get} users/:user/activities/:activity Get a activity for a user.
 * @apiName GetUsersActivityById
 * @apiGroup Activity
 * @apiPermission moderator, owner
 *
 * @apiSuccess {Activity} Activity The users activity.
 *
 * @apiSuccess {Date} createdAt       Time created
 * @apiSuccess {Date} updatedAt       Time updated
 * @apiSuccess {String} description   Description of activity
 * @apiSuccess {Number} coins         Amount of coins rewarded
 * @apiSuccess {Number} xp            Amount of XP rewarded
 * @apiSuccess {Number} userId        User ID activity belongs to
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *       {
 *         "id": 1,
 *         "createdAt": "2018-10-21T21:45:45.000Z",
 *         "updatedAt": "2018-10-21T21:45:45.000Z",
 *         "description": "You validated your email"
 *         "coins": 100,
 *         "xp": 0,
 *         "userId": 1
 *       }
 */
export async function gatherUserActivityById(request: UserRequest, response: Response) {
    const activityId = parseIntWithDefault(request.params.activity, null, 1, DATABASE_MAX_ID);

    if (_.isNil(activityId)) {
        throw new ApiError({
            message: 'Invalid activity id was provided.',
            code: 400,
        });
    }

    const activityRepository = getCustomRepository(ActivityRepository);

    const activity = await activityRepository.findOne({ user: request.boundUser, id: activityId });
    if (_.isNil(activity)) {
        throw new ApiError({
            message: 'The activity does not exist by the provided id.',
            code: 404,
        });
    }

    return response.json(activity);
}
