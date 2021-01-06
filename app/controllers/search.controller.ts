import { getCustomRepository } from 'typeorm';
import { Response } from 'express';
import * as _ from 'lodash';

import UserRepository from '../repository/user.repository';
import { UserRequest } from '../request/requests';
import ApiError from '../utils/apiError';

import { parseBooleanWithDefault, parseIntWithDefault, parseStringWithDefault } from '../utils/helpers';

import User from '../models/user.model';
import { USERNAME_MAX_LENGTH } from '../constants';
import GameRepository from '../repository/game.repository';
import Game from '../models/game.model';

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
export async function searchForUsers(request: UserRequest, response: Response) {
    const { limit, full } = request.query;

    const params = {
        email: parseStringWithDefault(request.query.email, '', 0, 50),
        username: parseStringWithDefault(request.query.username, '', 0, USERNAME_MAX_LENGTH),
        provider: parseStringWithDefault(request.query.provider, '', 0, 25),

        limit: parseIntWithDefault(limit, 50, 1, 50) as number,
        full: parseBooleanWithDefault(full, false) as boolean,
    };

    if (params.username === '' && params.email === '') {
        throw new ApiError({
            error: 'One of the specified username or email within the query must not be empty.',
            code: 400,
        });
    }

    const userRepository = getCustomRepository(UserRepository);
    const users = await userRepository.getUsersLikeUsernameOrEmail(params.username, params.email, params.limit, [
        'connections',
    ]);

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

/**
 * @api {get} /search/users/connections?provider=:provider&id=:id&limit=:limit Looks up users by provider and id.
 * @apiName LookupUsersByConnections
 * @apiGroup Search
 *
 * @apiParam {string} provider  The name of the provider, e.g twitch, discord.
 * @apiParam {string} id     The id of the user of the provider.
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
export async function searchForUsersByConnections(request: UserRequest, response: Response) {
    const { limit, full } = request.query;

    const provider = parseStringWithDefault(request.query.provider, '', 0, 25);
    const id = parseStringWithDefault(request.query.id, '', 0, 50);

    const params = {
        limit: parseIntWithDefault(limit, 50, 1, 50) as number,
        full: parseBooleanWithDefault(full, false) as boolean,
    };

    if (provider === '' || id === '') {
        throw new ApiError({
            error: 'One of the specified provider or id within the query must not be empty.',
            code: 400,
        });
    }

    const userRepository = getCustomRepository(UserRepository);
    const users = await userRepository.getUsersByProviderAndId(provider, id, params.limit, ['connections']);

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

/**
 * @api {get} /search/games?title=:title Looks up games by title.
 * @apiName LookupGamesByTitle
 * @apiGroup Search
 *
 * @apiParam {string} title  A partial or full title for a given game.
 * @apiParam {number} limit     The maximum amount of users to return (max 50)
 * @apiParam {boolean} full     If all the user details should be returned or
 * not.
 *
 * @apiSuccess {Games[]} Games    A array of games objects containing the username
 * and id.
 *
 * @apiSuccessExample Success-Response: HTTP/1.1 200 OK
 *     [{
 *        "title": "Fighting Bots",
 *        "id": 27
 *      }]
 */
export async function searchForGames(request: UserRequest, response: Response) {
    const { limit, full } = request.query;

    const title = parseStringWithDefault(request.query.title, '', 0, USERNAME_MAX_LENGTH);

    const params = {
        limit: parseIntWithDefault(limit, 50, 1, 50) as number,
        full: parseBooleanWithDefault(full, false) as boolean,
    };

    if (title === '') {
        throw new ApiError({
            error: 'The specified title within the query must not be empty.',
            code: 400,
        });
    }

    const gameRepository = getCustomRepository(GameRepository);
    const games = await gameRepository.getGamesLikeTitle(title, params.limit);

    // If the games has specified full user details, then return out early
    // before performing a filter to username and ids.
    if (params.full) return response.json(games);

    // Reduce the response down to the given title and id of the games.
    return response.json(
        games.map((e: Game) => {
            return { title: e.title, id: e.id };
        })
    );
}
