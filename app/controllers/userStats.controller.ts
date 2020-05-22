import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { isNil, defaultTo } from 'lodash';

import UserRepository from '../repository/user.repository';
import { Provider } from '../models/linkedAccount.model';
import LinkedAccountRepository from '../repository/linkedAccount.repository';
import { UserRequest } from '../request/requests';
import { parseStringWithDefault } from '../../test/helpers';

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
 * @apiSuccess {number} level The level of the user. default is 1.
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
 *      "level": 1,
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

/**
 * @api {get} /users/stats/coins Show the number of coins the user has.
 * @apiName GetCoinsOfUser
 * @apiGroup User
 *
 * @apiSuccess {string} coins The number of coins the user has.
 */
export async function getCoins(request: Request, response: Response) {
    const userRepository = getCustomRepository(UserRepository);
    const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);

    let coins = 0;
    const user = await userRepository.findByToken(request.cookies.token);
    const twitchId = parseStringWithDefault(request.query.twitchId as string, null);

    if (!isNil(user) && isNil(twitchId)) {
        const stats = await userRepository.findStatisticsForUser(user);
        coins += stats.coins;

        // Update the coins if the given user has a linked account and that linked account has a
        // given coins list.
        const linkedAccounts = await linkedAccountRepository.findAllByUserId(user.id);
        linkedAccounts.forEach((account) => (stats.coins += defaultTo(account.storage?.coins, 0)));
    }

    // specified twitch id from the query, this is different than just being based off the
    // authenticated user, which can be used to also determine the twitch account.
    if (!isNil(twitchId)) {
        const account = await linkedAccountRepository.findByProviderAndProviderId(Provider.TWITCH, twitchId);
        if (!isNil(account) && !isNil(account.storage?.coins)) coins += account.storage.coins;

        if (isNil(user) && !isNil(account.user)) {
            const stats = await userRepository.findStatisticsForUser(account.user);
            coins += stats.coins;
        }
    }

    return response.json(coins);
}
