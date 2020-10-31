import { Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { defaultTo } from 'lodash';

import UserRepository from '../repository/user.repository';
import LinkedAccountRepository from '../repository/linkedAccount.repository';
import { UserRequest } from '../request/requests';

/**
 * @api {get} /users/:user/statistics/ Get the statistics of a user.
 * @apiName GetStatsOfUser
 * @apiGroup User
 *
 * @apiParam {string} user The id of the user.
 *
 * @apiSuccess {number} id The id of the user.
 * @apiSuccess {datetime} updatedAt the time the user was last updated.
 * @apiSuccess {datetime} createdAt the time the user was created at.
 * @apiSuccess {number} coins The number of coins the user has. default is 0.
 * @apiSuccess {number} xp The amount of xp the user has. default is 0.
 * @apiSuccess {string} twitchId The Twitch id of the user.
 * @apiSuccess {object} game The game stats of the user.
 * @apiSuccess {number} game.id The id of the user.
 * @apiSuccess {datetime} game.updatedAt The time the user was last updated.
 * @apiSuccess {datetime} game.createdAt The time the user was created at.
 * @apiSuccess {number} game.wins The number of wins the user has.
 * @apiSuccess {number} game.loses The number of losses the user has.
 *
 * @apiSuccessExample {json} Success-Response:
 *      {
 *      "id": 1,
 *      "updatedAt": "1969-12-31T17:00:00.000Z",
 *      "createdAt": "1969-12-31T17:00:00.000Z",
 *      "coins": 48837,
 *      "xp": 600,
 *      "twitchId": null,
 *      "game": {
 *       "id": 1,
 *       "updatedAt": "1969-12-31T17:00:00.000Z",
 *       "createdAt": "1969-12-31T17:00:00.000Z",
 *       "wins": 1,
 *       "loses": 0
 *       }
 *      }
 */
export async function getUserStatisticsById(request: UserRequest, response: Response) {
    const { boundUser: user } = request;

    const userRepository = getCustomRepository(UserRepository);
    const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);

    const statistics = await userRepository.findStatisticsForUser(user);

    // gather all related link account coins.
    const linkedAccounts = await linkedAccountRepository.findAllByUserId(user.id);
    linkedAccounts.forEach((account) => (statistics.coins += defaultTo(account.storage?.coins, 0)));

    return response.json(statistics);
}
