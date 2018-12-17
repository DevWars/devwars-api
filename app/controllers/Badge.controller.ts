import { Request, Response } from "express";

import {BadgeRepository, UserRepository} from "../repository";

export class BadgeController {
    /**
     * @api {get} /badge Get badges
     * @apiVersion 1.0.0
     * @apiName all
     * @apiGroup Badge
     *
     * @apiSuccess {String} badge.name          Name of badge
     * @apiSuccess {String} badge.description   Description for badge
     * @apiSuccess {Number} badge.coins         Coins awarded on completion
     * @apiSuccess {Number} badge.xp            XP awarded on completion
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     [
     *       {
     *         "id": 1,
     *         "name": "Authentic"
     *         "description": "Verify your email address"
     *         "coins": 100,
     *         "xp": 0,
     *       },
     *       {
     *         "id": 2,
     *         "name": "Making Links"
     *         "description": "Connect any one social media account to your profile"
     *         "coins": 0,
     *         "xp": 50,
     *       }
     *     ]
     */

    public static async all(request: Request, response: Response) {
        const badges = await BadgeRepository.allWithUserCount();

        response.json(badges);
    }

    public static async forUser(request: Request, response: Response) {
        const user = await UserRepository.byId(request.params.user);
        const badges = await BadgeRepository.forUser(user);

        response.json(badges);
    }
}
