import { Request, Response } from "express";

import {ActivityRepository, UserRepository} from "../../repository";

export class ActivityController {
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

    public static async mine(request: Request, response: Response) {
        const user = await UserRepository.userForToken(request.cookies.auth);

        const activities = await ActivityRepository.forUser(user);

        response.json(activities);
    }
}
