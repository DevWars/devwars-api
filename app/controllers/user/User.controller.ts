import { getCustomRepository, getConnection } from 'typeorm';
import { Request, Response } from 'express';
import * as _ from 'lodash';

import GameApplication from '../../models/GameApplication';
import UserProfile from '../../models/UserProfile';
import UserStats from '../../models/UserStats';
import Activity from '../../models/Activity';

import LeaderboardRepository from '../../repository/leaderboard.repository';
import UserRepository from '../../repository/User.repository';
import { IUserRequest } from '../../request/IRequest';
import { DATABASE_MAX_ID } from '../../constants';
import ApiError from '../../utils/apiError';
import { hash } from '../../utils/hash';

import { parseIntWithDefault, parseBooleanWithDefault } from '../../../test/helpers';

import EmailVerification from '../../models/EmailVerification';
import LinkedAccount from '../../models/LinkedAccount';
import PasswordReset from '../../models/PasswordReset';
import UserGameStats from '../../models/UserGameStats';
import { GameStatus } from '../../models/GameSchedule';
import EmailOptIn from '../../models/EmailOptIn';
import { UserRole } from '../../models/User';
import User from '../../models/User';

interface IUpdateUserRequest {
    lastSigned: Date;
    email: string;
    username: string;
    password: string;
    role: UserRole;
    token: string;
}

/**
 * @api {get} /lookup?username=:username&limit=:limit Looks up users by username (like match).
 * @apiName LookupUsersByUsername
 * @apiGroup User
 *
 * @apiParam {string} username  A partial or full username for a given user.
 * @apiParam {number} limit     The maximum amount of users to return (max 50)
 * @apiParam {boolean} full     If all the user details should be returned or not.
 *
 * @apiSuccess {User[]} Users    A array of user objects containing the username and id.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *        "username": "Sadie_Brekke21",
 *        "id": 27
 *      },
 *      {
 *        "username": "Aubrey.Watsica15",
 *        "id": 59
 *      },
 *      {
 *        "username": "Alessia.Breitenberg",
 *        "id": 83
 *      }]
 */
export async function lookupUser(request: IUserRequest, response: Response) {
    let { username, limit, full } = request.query;

    if (_.isNil(username)) username = '';
    username = username.replace(/\s/g, '').trim();

    limit = parseIntWithDefault(limit, 50, 1, 50);
    full = parseBooleanWithDefault(full, false);

    if (username === '') {
        throw new ApiError({
            error: 'The specified username within the query must not be empty.',
            code: 400,
        });
    }

    const userRepository = getCustomRepository(UserRepository);
    const users = await userRepository.getUsersLikeUsername(username, limit);

    // If the user has specified full user details, then return out early
    // before performing a filter to username and ids.
    if (full) return response.json(users);

    // Reduce the response down to the given username and id of the users.
    return response.json(
        users.map((e) => {
            return { username: e.username, id: e.id };
        })
    );
}

/**
 * @api {get} /:user Request User basic information
 * @apiName GetUserById
 * @apiGroup User
 *
 * @apiParam {Number} user Users unique ID.
 *
 * @apiSuccess {string} username    The username of the User.
 * @apiSuccess {string} role        The role of the User.
 * @apiSuccess {number} id          The id of the User.
 * @apiSuccess {string} avatarUrl   The avatar url of the User.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      "username": "test-admin",
 *      "role": "ADMIN",
 *      "id": 1,
 *      "avatarUrl": "http://lorempixel.com/640/480/nature"
 *    }
 */
export async function show(request: IUserRequest, response: Response) {
    const sanitizedUser = request.boundUser.sanitize('email', 'lastSignIn', 'createdAt', 'updatedAt');
    return response.json(sanitizedUser);
}

/**
 * @api {get} /:user Request All User basic information
 * @apiName GetUsers
 * @apiGroup User
 * @apiPermission moderator
 *
 * @apiParam {string} limit The number of users to gather from the offset. (limit: 100)
 * @apiParam {string} offset The offset of which place to start gathering users from.
 *
 * @apiSuccess {json} Users The users within the limit and offset.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     [{
 *      "username": "test-admin",
 *      "role": "ADMIN",
 *      "id": 1,
 *      "avatarUrl": "http://lorempixel.com/640/480/nature"
 *      "updatedAt": "2019-11-19T14:54:09.441Z",
 *      "createdAt": "2019-11-19T14:54:09.441Z",
 *      "lastSignIn": "2019-11-19T14:54:09.442Z",
 *     },
 *     {
 *      "username": "Lelia_Boyer",
 *      "email": "William_Rowe1@yahoo.com",
 *      "role": "MODERATOR",
 *      "id": 5,
 *      "updatedAt": "2019-11-19T14:54:09.479Z",
 *      "createdAt": "2019-11-19T14:54:09.479Z",
 *      "lastSignIn": "2019-11-19T14:54:09.481Z",
 *      "avatarUrl": "http://lorempixel.com/640/480/cats"
 *     }]
 */
export async function all(request: Request, response: Response) {
    const limit = parseIntWithDefault(request.query.limit, 25, 1, 100);
    const offset = parseIntWithDefault(request.query.offset, 0, 0);

    const users = await User.createQueryBuilder('user')
        .orderBy('"updatedAt"', 'DESC')
        .limit(limit > 100 || limit < 1 ? 100 : limit)
        .offset(offset < 0 ? 0 : offset)
        .getMany();

    return response.json(users);
}

/**
 * @api {post} /:user Updates User basic information
 * @apiName UpdateUserById
 * @apiGroup User
 * @apiPermission moderator, owner
 *
 * @apiParam {Number} user Users unique ID.
 * @apiParam {string} [username] Users updated username.
 * @apiParam {string} [email] Users updated email.
 * @apiParam {string} [password] Users updated password.
 * @apiParam {string} [role] Users updated role.
 * @apiParam {string} [token] Users updated token.
 * @apiParam {string} [lastSigned] Users updated last signed in date.
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *      "username": "test-admin",
 *      "email": "test-admin@example.com",
 *      "password": "password",
 *      "token": "token",
 *      "role": "ADMIN",
 *      "lastSigned": "2019-11-20T15:51:24.690Z",
 *     }
 *
 * @apiSuccess {string} username    the username of the User.
 * @apiSuccess {string} role        the role of the User.
 * @apiSuccess {number} id          the id of the User.
 * @apiSuccess {string} avatarUrl   the avatar url of the User.
 * @apiSuccess {datetime} updatedAt the time the user was last updated.
 * @apiSuccess {datetime} createdAt the time the user was created at.
 * @apiSuccess {datetime} lastSignIn the time the user last signed in.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      "username": "test-admin",
 *      "email": "test-admin@example.com",
 *      "role": "ADMIN",
 *      "id": 1,
 *      "avatarUrl": "http://lorempixel.com/640/480/nature"
 *      "updatedAt": "2019-11-19T14:54:09.441Z",
 *      "createdAt": "2019-11-19T14:54:09.441Z",
 *      "lastSignIn": "2019-11-19T14:54:09.442Z",
 *     }
 */
export async function update(request: IUserRequest, response: Response) {
    const params = request.body as IUpdateUserRequest;

    const userRepository = getCustomRepository(UserRepository);
    const existingUsername = await userRepository.findByUsername(params.username);

    if (!_.isNil(existingUsername) && existingUsername.id !== request.boundUser.id) {
        throw new ApiError({
            error: 'The provided username already exists for a registered user.',
            code: 409,
        });
    }

    // Ensure to encrypt the updated password if it has been specified.
    if (!_.isNil(params.password)) params.password = await hash(params.password);

    Object.assign(request.boundUser, params);
    await request.boundUser.save();

    return response.json(request.boundUser);
}

/**
 * @api {delete} /:user Deletes the user from the system
 * @apiName DeleteUserById
 * @apiGroup User
 * @apiPermission admin, owner
 *
 * @apiParam {Number} user Users unique ID.
 * @apiParam {string} [lastSigned] Users updated last signed in date.
 */
export async function deleteUser(request: IUserRequest, response: Response) {
    const { boundUser: removingUser } = request;
    const { id: removingUserId } = removingUser;

    if (removingUser.role <= UserRole.MODERATOR) {
        const removalError = 'Users with roles moderator or higher cannot be deleted, ensure to demote the user first.';
        throw new ApiError({ code: 400, error: removalError });
    }

    await getConnection().transaction(async (transaction) => {
        const whereOptions = { where: { user: removingUser } };

        // First remove all related activities for the given user. Since the user is being removed, any
        // action taken by the user is only related to a given user and should be removed (not replaced
        // by competitor).
        const activities = await transaction.find(Activity, whereOptions);
        await transaction.remove(activities);

        // Remove the given users related profile && users stats
        const profiles = await transaction.find(UserProfile, whereOptions);
        await transaction.remove(profiles);

        // remove the given users related email permissions
        const emailPermissions = await transaction.find(EmailOptIn, whereOptions);
        await transaction.remove(emailPermissions);

        const statistics = await transaction.find(UserStats, whereOptions);
        await transaction.remove(statistics);

        const gameStatistics = await transaction.find(UserGameStats, whereOptions);
        await transaction.remove(gameStatistics);

        // remove the given users related accounts
        const linkedAccounts = await transaction.find(LinkedAccount, whereOptions);
        await transaction.remove(linkedAccounts);

        // remove the given users password resets
        const passwordResets = await transaction.find(PasswordReset, whereOptions);
        await transaction.remove(passwordResets);

        // remove the given users email verification
        const emailVerifications = await transaction.find(EmailVerification, whereOptions);
        await transaction.remove(emailVerifications);

        // All future game applications in which the game has not occurred yet can be removed, any
        // in the past can be replaced. So delete all future game applications.
        const futureGameApplications = await transaction
            .getRepository(GameApplication)
            .createQueryBuilder('app')
            .leftJoin('app.schedule', 'game_schedule')
            .andWhere('game_schedule.status = :gameStatus')
            .andWhere('app."userId" = :user')
            .setParameters({ user: removingUser.id, gameStatus: GameStatus.SCHEDULED })
            .getMany();

        await transaction.remove(futureGameApplications);

        // For all applications that exist for the user that have already taken place, ensure that
        // they are purged from the players and editors body.
        const gameApplications = await transaction.find(
            GameApplication,
            Object.assign(whereOptions, { relations: ['schedule', 'schedule.game'] })
        );

        for (const application of gameApplications) {
            const gameStorage = application.schedule?.game?.storage;
            application.user = null;

            // Update the inner game players model to replace the removing user with the replacement
            // user. Since these will be rendered on the home page.
            if (!_.isNil(gameStorage?.players) && !_.isNil(gameStorage.players[removingUserId])) {
                const player = gameStorage.players[removingUserId];

                gameStorage.players['0'] = { id: 0, team: player.team, username: 'Competitor' };
                delete gameStorage.players[removingUserId];
            }

            // update the editor to replace the known user with the competitor user.
            if (!_.isNil(gameStorage?.editors)) {
                for (const editorsKey of Object.keys(gameStorage?.editors)) {
                    if (gameStorage.editors[editorsKey]?.player === removingUserId) {
                        gameStorage.editors[editorsKey].player = 0;
                    }
                }
            }

            // Only attempt to save the game again if the game is not null.
            if (!_.isNil(application.schedule.game)) await transaction.save(application.schedule.game);
            await transaction.remove(application);
        }

        // Finally delete the user.
        await transaction.remove(removingUser);
    });

    return response.json({ user: removingUserId });
}

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

    if (leaderboards.length === 0) pagination.after = null;
    if (params.after === 0) pagination.before = null;

    return response.json({
        data: leaderboards,
        pagination,
    });
}
