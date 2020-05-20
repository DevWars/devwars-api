import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { isNil, defaultTo } from 'lodash';

import UserStats from '../models/userStats.model';
import UserRepository from '../repository/User.repository';
import { Provider } from '../models/linkedAccount.model';
import LinkedAccountRepository from '../repository/LinkedAccount.repository';
import { UserRequest } from '../request/IRequest';
import ApiError from '../utils/apiError';
import { parseStringWithDefault } from '../../test/helpers';

/**
 * @api {get} /users/:user/stats Get the stats of a user.
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
export async function forUser(request: UserRequest, response: Response) {
    const { boundUser: user } = request;

    const userRepository = getCustomRepository(UserRepository);
    const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);

    const stats = await userRepository.findStatsByUser(user);

    // gather all related link account coins.
    const linkedAccounts = await linkedAccountRepository.findAllByUserId(user.id);
    linkedAccounts.forEach((account) => (stats.coins += defaultTo(account.storage?.coins, 0)));

    return response.json(stats);
}

/**
 * @api {post} /users/:user/stats Create stats for a user.
 * @apiName CreateStatsForUser
 * @apiGroup User
 *
 * @apiParam {string} user The id of the user.
 * @apiParam {number} coins The number of coins the user has. minimum is 0.
 * @apiParam {number} xp The amount of xp the user has. minimum is 0.
 * @apiParam {number} level The level of the user. minimum is 1.
 * @apiParam {string} twitchId The twitch id of the user.
 *
 * @apiParamExample {json} Request-Example:
 *      {
 *          "coins": 10,
 *          "xp": 3,
 *          "level": 4,
 *          "twitchId": "24485211"
 *      }
 *
 * @apiSuccess {number} coins The number of coins the user has.
 * @apiSuccess {number} xp The amount of xp the user has.
 * @apiSuccess {number} level The level of the user.
 * @apiSuccess {string} twitchId The twitch id of the user.
 */
export async function create(request: UserRequest, response: Response) {
    const existingStatus = await UserStats.findOne({ where: { user: request.boundUser.id } });

    if (!isNil(existingStatus)) {
        throw new ApiError({
            error: `The user ${request.boundUser.username} already has existing user stats.`,
            code: 409,
        });
    }

    const stats = new UserStats();
    stats.user = request.boundUser;

    Object.assign(stats, request.body);

    await stats.save();
    return response.json(stats);
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
        const stats = await userRepository.findStatsByUser(user);
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
            const stats = await userRepository.findStatsByUser(account.user);
            coins += stats.coins;
        }
    }

    return response.json(coins);
}
