import { Response } from 'express';
import { getCustomRepository } from 'typeorm';
import ActivityRepository from '../../repository/Activity.repository';
import { IRequest } from '../../request/IRequest';

/**
 * @api {get} /activity/:user Get activities from user
 * @apiVersion 1.0.0
 * @apiName all
 * @apiGroup Activity
 *
 * @apiParam {Number} User ID
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
export async function mine(request: IRequest, response: Response) {
    const activityRepository = getCustomRepository(ActivityRepository);
    const activities = await activityRepository.findByUser(request.user);

    return response.json(activities);
}
