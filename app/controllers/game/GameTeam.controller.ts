import {Request, Response} from "express";

import {GameRepository} from "../../repository/Game.repository";

import {GameTeamRepository} from "../../repository/GameTeam.repository";
import {GameTeam} from "../../models";

export class GameTeamController {
    /**
     * @api {get} /game/:game/teams Get teams from game
     * @apiVersion 1.0.0
     * @apiName forGame
     * @apiGroup GameTeam
     *
     * @apiParam {Number} Game ID
     *
     * @apiSuccess {Date} gameTeam.createdAt     Time created
     * @apiSuccess {Date} gameTeam.updatedAt     Time updated
     * @apiSuccess {String} gameTeam.status      Status of game displayed to viewers
     * @apiSuccess {String} gameTeam.name        Color of team
     * @apiSuccess {Boolean} gameTeam.winner     Whether or not team won
     * @apiSuccess {Object} gameTeam.votes       User vote counts from broadcast
     * @apiSuccess {Number} gameTeam.gameId      ID of game team belongs to
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     [
     *       {
     *         "id": 1,
     *         "createdAt": "2018-10-21T21:45:45.000Z",
     *         "updatedAt": "2018-10-21T21:45:45.000Z",
     *         "status": "Waiting",
     *         "name": "blue",
     *         "winner": true,
     *         "votes": { ui: 28, ux: 82 },
     *         "gameId": 1
     *       },
     *       {
     *         "id": 2,
     *         "createdAt": "2018-10-21T21:45:45.000Z",
     *         "updatedAt": "2018-10-21T21:45:45.000Z",
     *         "status": "Waiting",
     *         "name": "red",
     *         "winner": false,
     *         "votes": { ui: 36, ux: 73 },
     *         "gameId": 1
     *       }
     *     ]
     */

    public static async forGame(request: Request, response: Response) {
        const game = await GameRepository.byId(request.params.game);

        const teams = await GameTeamRepository.forGame(game);

        response.json(teams);
    }

    public static async update(request: Request, response: Response) {
        const team = await GameTeamRepository.byId(request.params.team);

        Object.assign(team, request.body);

        await team.save();

        response.json(team);
    }
}
