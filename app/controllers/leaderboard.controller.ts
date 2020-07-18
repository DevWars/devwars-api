import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';

import UserRepository from '../repository/user.repository';

/**
 * @api {get} /users/leaderboards Get the current win based leaderboards for all users.
 * @apiDescription Gathers the current win leaderboard statistics for all users in a paging fashion.
 * @apiName GetLeaderboardsForUser
 * @apiGroup User
 *
 * @apiParam {string} limit The number of users to gather from the offset. (limit: 100)
 * @apiParam {string} offset The offset of which place to start gathering users from.
 *
 * @apiSuccess {json} Leaderboards The users leaderboards within the limit and offset.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * {
 *   "data": [
 *     {
 *         "userId": 46,
 *         "username": "Sigurd.Harber",
 *         "wins": 5,
 *         "loses": 17,
 *         "xp": 15039,
 *         "coins": 18316,
 *         "level": 3
 *       ]
 *     }
 *   ],
 *  "pagination": {
 *      "next": "bmV4dF9fQWxleGFubmVfQWx0ZW53ZXJ0aA==",
 *      "previous": null
 *  }
 * }
 */
export async function getUsersLeaderboards(request: Request, response: Response) {
    const userRepository = getCustomRepository(UserRepository);

    const results = await userRepository
        .createQueryBuilder('user')
        .innerJoinAndSelect('user.gameStats', 'gameStats')
        .innerJoinAndSelect('user.stats', 'stats')
        .orderBy('gameStats.wins', 'DESC')
        .take(30)
        .getMany();

    return response.json({ data: results });
}
