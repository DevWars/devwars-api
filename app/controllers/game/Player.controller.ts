import { Request, Response } from 'express';

import GameRepository from '../../repository/Game.repository';
import GameTeamRepository from '../../repository/GameTeam.repository';
import UserRepository from '../../repository/User.repository';

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

    public static async addPlayer(request: Request, response: Response) {
        const team = await GameTeamRepository.byId(request.params.team);

        const { language, user: userId } = request.query;

        const user = await UserRepository.byId(userId);

        if (!user) {
            return response.status(400).json({
                message: 'Player does not exist',
            });
        }

        const player = await new Player();

        player.user = user;
        player.language = language;
        player.team = team;

        await player.save();

        return response.json(player);
    }

    public static async removePlayer(request: Request, response: Response) {
        const player = await Player.findOne(request.params.player);

        if (!player) {
            return response.status(400).json({
                message: 'Player does not exist',
            });
        }

        await player.remove();

        return response.json({
            message: 'Player removed',
        });
    }
}
