import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { isNil } from 'lodash';

import UserStats from '../../models/UserStats';
import UserRepository from '../../repository/User.repository';
import { Provider } from '../../models/LinkedAccount';
import LinkedAccountRepository from '../../repository/LinkedAccount.repository';
import { IUserRequest } from '../../request/IRequest';

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
 *      "id": 1,
 *      "updatedAt": "1969-12-31T17:00:00.000Z",
 *      "createdAt": "1969-12-31T17:00:00.000Z",
 *      "wins": 1,
 *      "loses": 0
 *      }
 *      }
 */

export async function forUser(request: IUserRequest, response: Response) {
    const userRepository = getCustomRepository(UserRepository);
    const stats = await userRepository.findStatsByUser(request.boundUser);

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

export async function create(request: IUserRequest, response: Response) {
    const existingStatus = await UserStats.findOne({ where: { user: request.boundUser.id } });

    if (!isNil(existingStatus)) {
        return response.status(409).json({
            error: `The user ${request.boundUser.username} already has existing user stats.`,
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
    const { twitchId } = request.query;
    let coins = 0;

    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findByToken(request.cookies.token);
    if (user) {
        const stats = await userRepository.findStatsByUser(user);
        coins += stats.coins;
    }

    if (twitchId) {
        const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
        const account = await linkedAccountRepository.findByProviderAndProviderId(Provider.TWITCH, twitchId);

        if (account && account.storage && account.storage.coins) {
            coins += account.storage.coins;
        }

        if (!user && account.user) {
            const stats = await userRepository.findStatsByUser(account.user);
            coins += stats.coins;
        }
    }

    return response.json(coins);
}
