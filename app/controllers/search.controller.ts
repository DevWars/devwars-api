import { getCustomRepository } from 'typeorm';
import { Response } from 'express';
import * as _ from 'lodash';

import UserRepository from '../repository/User.repository';
import { IUserRequest } from '../request/IRequest';
import ApiError from '../utils/apiError';

import { parseBooleanWithDefault, parseIntWithDefault, parseStringWithDefault } from '../../test/helpers';

import User from '../models/User';
import { USERNAME_MAX_LENGTH } from '../constants';

/**
 * @api {get} /search/users?username=:username&email=:email&limit=:limit Looks
 * up users by username or email (like match).
 * @apiName LookupUsersByUsernameOrEmail
 * @apiGroup Search
 *
 * @apiParam {string} username  A partial or full username for a given user.
 * @apiParam {string} email     A partial or full email for a given user.
 * @apiParam {number} limit     The maximum amount of users to return (max 50)
 * @apiParam {boolean} full     If all the user details should be returned or
 * not.
 *
 * @apiSuccess {User[]} Users    A array of user objects containing the username
 * and id.
 *
 * @apiSuccessExample Success-Response: HTTP/1.1 200 OK
 *     [{
 *        "username": "Sadie_Brekke21",
 *        "email": "Sadie_Brekke21@example.com",
 *        "id": 27
 *      },
 *      {
 *        "username": "Aubrey.Watsica15",
 *        "email": "Aubrey.Watsica15@example.com",
 *        "id": 59
 *      },
 *      {
 *        "username": "Alessia.Breitenberg",
 *        "email": "Alessia.Breitenberg@example.com",
 *        "id": 83
 *      }]
 */
export async function lookupUser(request: IUserRequest, response: Response) {
    let { limit, full } = request.query;

    const username = parseStringWithDefault(request.query.username, '', 0, USERNAME_MAX_LENGTH);
    const email = parseStringWithDefault(request.query.email, '', 0, 50);

    const params = {
        limit: parseIntWithDefault(limit, 50, 1, 50) as number,
        full: parseBooleanWithDefault(full, false) as boolean,
    };

    if (username === '' && email === '') {
        throw new ApiError({
            error: 'One of the specified username or email within the query must not be empty.',
            code: 400,
        });
    }

    const userRepository = getCustomRepository(UserRepository);
    const users = await userRepository.getUsersLikeUsernameOrEmail(username, email, params.limit, ['connections']);

    _.forEach(users, (user: any) => {
        user.connections = _.map(user.connections, (a) => {
            return { username: a.username, provider: a.provider.toLowerCase() };
        });
    });

    // If the user has specified full user details, then return out early
    // before performing a filter to username and ids.
    if (params.full) return response.json(users);

    // Reduce the response down to the given username and id of the users.
    return response.json(
        users.map((e: User) => {
            return { username: e.username, email: e.email, id: e.id, connections: e.connections };
        })
    );
}
