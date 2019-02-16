import {Request, Response} from "express";

import {GameRepository} from "../../repository";

import {getConnection} from "typeorm";
import {ObjectiveFactory} from "../../factory";
import {Objective} from "../../models";
import {ObjectiveRepository} from "../../repository";
import {ObjectiveService} from "../../services/Objective.service";

export class ObjectiveController {
    /**
     * @api {get} /game/:game/objectives Get objectives from game
     * @apiVersion 1.0.0
     * @apiName forGame
     * @apiGroup Objective
     *
     * @apiParam {Number} Game ID
     *
     * @apiSuccess {Date} objective.createdAt       Time created
     * @apiSuccess {Date} objective.updatedAt       Time updated
     * @apiSuccess {String} objective.description   Description for objective
     * @apiSuccess {Number} objective.number        Display order of objective
     * @apiSuccess {Boolean} objective.bonus        If objective is bonus
     * @apiSuccess {Number} objective.gameId        ID of game team belongs to
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     [
     *       {
     *         "id": 1,
     *         "createdAt": "2018-10-21T21:45:45.000Z",
     *         "updatedAt": "2018-10-21T21:45:45.000Z",
     *         "description": "Create a list of all messages sent"
     *         "number": 1,
     *         "bonus": false,
     *         "gameId": 1
     *       },
     *       {
     *         "id": 2,
     *         "createdAt": "2018-10-21T21:45:45.000Z",
     *         "updatedAt": "2018-10-21T21:45:45.000Z",
     *         "description": "Clicking send adds a new chat to the window"
     *         "number": 2,
     *         "bonus": true,
     *         "gameId": 1
     *       }
     *     ]
     */

    public static async forGame(request: Request, response: Response) {
        const game = await GameRepository.byId(request.params.game);

        const objectives = await ObjectiveRepository.forGame(game);

        response.json(objectives);
    }

    public static async store(request: Request, response: Response) {
        const game = await GameRepository.byId(request.params.game);
        const newObjectives = request.body as Objective[];

        await ObjectiveService.replaceForGame(game, newObjectives);

        response.json(ObjectiveRepository.forGame(game));
    }
}
