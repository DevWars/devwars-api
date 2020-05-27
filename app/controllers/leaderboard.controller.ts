import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import LeaderboardRepository from '../repository/leaderboard.repository';
import { parseIntWithDefault } from '../../test/helpers';
import { DATABASE_MAX_ID } from '../constants';

/**
 * @api {get} /users/leaderboards Get the current win based leaderboards for all users.
 * @apiDescription Gathers the current win leaderboard statistics for all users in a paging fashion.
 * @apiName GetLeaderboardsForUser
 * @apiGroup User
 *
 * @apiParam {number} first How many users to be returned, default 20, min: 1, max: 100
 * @apiParam {number} after A offset at which point to start gathering users, default: 0, min: 0
 *
 * @apiSuccessExample Success-Response /users/leaderboards?first=5&after=40:
 *     HTTP/1.1 200 OK
 * {
 *     "data": [
 *       {
 *         "userId": 46,
 *         "username": "Sigurd.Harber",
 *         "wins": 5,
 *         "loses": 17,
 *         "xp": 15039,
 *         "coins": 18316,
 *         "level": 3
 *       },
 *       {
 *         "userId": 42,
 *         "username": "Carolyne_McClure85",
 *         "wins": 5,
 *         "loses": 13,
 *         "xp": 13695,
 *         "coins": 1888,
 *         "level": 2
 *       },
 *     ],
 *     "pagination": {
 *       "before": "http://localhost:8080/users/leaderboards?first=5&after=35",
 *       "after": "http://localhost:8080/users/leaderboards?first=5&after=45"
 *     }
 *   }
 */
export async function getUsersLeaderboards(request: Request, response: Response) {
    const { first, after } = request.query;

    const params = {
        first: parseIntWithDefault(first, 20, 1, 100),
        after: parseIntWithDefault(after, 0, 0, DATABASE_MAX_ID),
    };

    const leaderboardRepository = getCustomRepository(LeaderboardRepository);
    const leaderboards = await leaderboardRepository.findUsers(params.first, params.after);

    const url = `${request.protocol}://${request.get('host')}${request.baseUrl}${request.path}`;

    const pagination = {
        before: `${url}?first=${params.first}&after=${_.clamp(params.after - params.first, 0, params.after)}`,
        after: `${url}?first=${params.first}&after=${params.after + params.first}`,
    };

    if (leaderboards.length === 0 || leaderboards.length !== params.first) pagination.after = null;
    if (params.after === 0) pagination.before = null;

    return response.json({
        data: leaderboards,
        pagination,
    });
}
