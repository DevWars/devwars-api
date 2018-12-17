import {Request, Response} from "express";

import {CompetitorRepository, UserRepository} from "../../repository";

import {Competitor} from "../../models";

export class CompetitorController {
    /**
     * @api {get} /user/:user/competitor Get competitor from user
     * @apiVersion 1.0.0
     * @apiName forUser
     * @apiGroup Competitor
     *
     * @apiParam {Number} User ID
     *
     * @apiSuccess {Date} competitor.createdAt       Time created
     * @apiSuccess {Date} competitor.updatedAt       Time updated
     * @apiSuccess {Date} competitor.dob             Date of birth
     * @apiSuccess {Object} competitor.ratings       Skill levels for each language
     * @apiSuccess {Object} competitor.name          First and last name
     * @apiSuccess {Object} competitor.address       Full home address
     * @apiSuccess {Number} competitor.userId        ID of user competitor belongs to
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "id": 1,
     *       "createdAt": "2018-10-21T21:45:45.000Z",
     *       "updatedAt": "2018-10-21T21:45:45.000Z",
     *       "dob": "1992-11-27T01:35:33.115Z",
     *       "ratings": { css: 4, html: 1, js: 4 },
     *       "name": { firstName: "John", lastName: "Smith" },
     *       "address": {
     *         addressOne: "504 Hegmann Lakes",
     *         addressTwo: "Suite 068",
     *         city: "South Madelynnburgh",
     *         state: "North Dakota",
     *         zip: "35080-3075",
     *         country: "Canada"
     *       },
     *       "userId": 1
     *     }
     */

    public static async forUser(request: Request, response: Response) {
        const user = await UserRepository.byId(request.params.user);

        const competitor = await CompetitorRepository.forUser(user);

        response.json(competitor);
    }

    public static async create(request: Request, response: Response) {
        const user = await UserRepository.byId(request.params.user);

        const existing = await CompetitorRepository.forUser(user);

        if (existing) {
            return response.status(400).json({
                message: "You are already a competitor",
            });
        }

        const competitor = new Competitor();
        competitor.user = user;

        Object.assign(competitor, request.body);

        await competitor.save();

        response.json(competitor);
    }
}
