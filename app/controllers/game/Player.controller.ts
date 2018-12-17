import {Request, Response} from "express";

import {GameRepository, GameTeamRepository, PlayerRepository} from "../../repository";

export class PlayerController {
    /**
     * @api {get} /game/:game/team/:team/players Get players from game and team
     * @apiVersion 1.0.0
     * @apiName forTeam
     * @apiGroup Player
     *
     * @apiParam {Number} Game ID
     * @apiParam {String} Team Color
     *
     * @apiSuccess {Date} player.createdAt       Time created
     * @apiSuccess {Date} player.updatedAt       Time updated
     * @apiSuccess {String} player.language      Position language
     * @apiSuccess {Number} player.teamId        ID of team player belongs to
     * @apiSuccess {Number} player.userId        ID of user player belongs to
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     [
     *       {
     *         "id": 1,
     *         "createdAt": "2018-10-21T21:45:45.000Z",
     *         "updatedAt": "2018-10-21T21:45:45.000Z",
     *         "language": "html"
     *         "teamId": 1,
     *         "userId": 1
     *       },
     *       {
     *         "id": 2,
     *         "createdAt": "2018-10-21T21:45:45.000Z",
     *         "updatedAt": "2018-10-21T21:45:45.000Z",
     *         "language": "css"
     *         "teamId": 1,
     *         "userId": 2
     *       },
     *       {
     *         "id": 3,
     *         "createdAt": "2018-10-21T21:45:45.000Z",
     *         "updatedAt": "2018-10-21T21:45:45.000Z",
     *         "language": "js"
     *         "teamId": 1,
     *         "userId": 3
     *       }
     *     ]
     */

    public static async forTeam(request: Request, response: Response) {
        const game = await GameRepository.byId(request.params.game);
        const team = await GameTeamRepository.forGameAndTeamName(game, request.params.team);

        const players = await PlayerRepository.forTeam(team);

        response.json(players);
    }
}
