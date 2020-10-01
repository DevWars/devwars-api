import { Response } from 'express';
import { getCustomRepository } from 'typeorm';

import UserRepository from '../repository/user.repository';
import { UserRequest } from '../request/requests';

/**
 * @api {get} /users/:user/statistics/game Get the game statistics of a user.
 * @apiName GetGameStatsOfUser
 * @apiGroup User
 *
 * @apiParam {string} user The id of the user.
 *
 * @apiSuccess {number} id The id of the user.
 * @apiSuccess {datetime} updatedAt The time the user was last updated.
 * @apiSuccess {datetime} createdAt The time the user was created at.
 * @apiSuccess {number} wins The number of wins the user has.
 * @apiSuccess {number} loses The number of losses the user has.
 *
 * @apiSuccessExample {json} Success-Response:
 *      {
 *       "id": 1,
 *       "updatedAt": "1969-12-31T17:00:00.000Z",
 *       "createdAt": "1969-12-31T17:00:00.000Z",
 *       "wins": 1,
 *       "loses": 0
 *      }
 */
export async function getUserGameStatisticsById(request: UserRequest, response: Response) {
    const userRepository = getCustomRepository(UserRepository);
    const stats = await userRepository.findGameStatsByUser(request.boundUser);
    return response.json(stats);
}
