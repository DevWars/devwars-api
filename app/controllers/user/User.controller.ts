import { getConnection, getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';
import * as _ from 'lodash';
import { addDays } from 'date-fns';

import GameApplication from '../../models/GameApplication';
import UserProfile from '../../models/UserProfile';
import UserStats from '../../models/UserStats';
import Activity from '../../models/Activity';

import LeaderboardRepository from '../../repository/leaderboard.repository';
import UserRepository from '../../repository/User.repository';
import { AuthorizedRequest, UserRequest } from '../../request/IRequest';
import { DATABASE_MAX_ID, USERNAME_CHANGE_MIN_DAYS } from '../../constants';
import ApiError from '../../utils/apiError';

import { parseIntWithDefault } from '../../../test/helpers';

import EmailVerification from '../../models/EmailVerification';
import LinkedAccount from '../../models/LinkedAccount';
import PasswordReset from '../../models/PasswordReset';
import UserGameStats from '../../models/UserGameStats';
import EmailOptIn from '../../models/EmailOptIn';
import User, { UserRole } from '../../models/User';
import Game from '../../models/Game';
import { isRoleHigher, isRoleOrHigher } from '../authentication/Authentication.controller';
import PaginationService from '../../services/pagination.service';

interface UpdateUserRequest {
    username: string;
    role: UserRole;
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
export async function show(request: UserRequest, response: Response) {
    const sanitizedUser = request.boundUser.sanitize(
        'email',
        'lastSignIn',
        'createdAt',
        'updatedAt',
        'lastUsernameUpdateAt'
    );
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
 * {
 *   "data": [
 *     {
 *       "username": "example",
 *       "email": "example@gmail.com",
 *       "role": "MODERATOR",
 *       "id": 1354,
 *       "updatedAt": "2020-01-26T00:30:11.052Z",
 *       "createdAt": "2019-02-02T17:17:09.000Z",
 *       "lastSignIn": "2020-01-26T00:30:11.050Z",
 *       "avatarUrl": null,
 *       "connections": [
 *         {
 *           "username": "tehstun",
 *           "provider": "discord"
 *         },
 *         {
 *           "username": "mambadev",
 *           "provider": "twitch"
 *         }
 *       ]
 *     }
 *   ],
 *  "pagination": {
 *      "next": "bmV4dF9fQWxleGFubmVfQWx0ZW53ZXJ0aA==",
 *      "previous": null
 *  }
 * }
 */
export async function getAllUsersWithPaging(request: Request, response: Response) {
    const { after, before, first } = request.query as { after: any; before: any; first: any };

    const limit = parseIntWithDefault(first, 20, 1, 100);

    const userRepository = getCustomRepository(UserRepository);
    const result = await PaginationService.pageRepository<User>(
        userRepository,
        limit,
        after,
        before,
        'username',
        false,
        ['connections']
    );

    return response.json(result);
}

/**
 * @api {post} /:user Updates User basic information
 * @apiName UpdateUserById
 * @apiGroup User
 * @apiPermission moderator, owner
 *
 * @apiParam {Number} user Users unique ID.
 * @apiParam {string} [username] Users updated username.
 * @apiParam {string} [role] Users updated role.
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *      "username": "test-admin",
 *      "role": "ADMIN",
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
 * @apiSuccessExample Success-Response: HTTP/1.1 200 OK
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
 *
 * @apiError NotAuthorizedForRoleChange You are not authorized to increase the
 * role of yourself or another user higher than your own and if you are not a
 * admin. You also cannot decrease a role of a user if you are not a higher
 * role (including yourself).
 */
export async function updateUserById(request: AuthorizedRequest & UserRequest, response: Response) {
    const params = request.body as UpdateUserRequest;

    const userRepository = getCustomRepository(UserRepository);
    const existingUsername = await userRepository.findByUsername(params.username);

    if (!_.isNil(existingUsername) && existingUsername.id !== request.boundUser.id) {
        throw new ApiError({
            error: 'The provided username already exists for a registered user.',
            code: 409,
        });
    }

    // Use a direct object over the params, since if anything other breaks that
    // is outside our control, we still have access to what data is being
    // updated.
    const updateRequest = {} as UpdateUserRequest;

    if (!_.isNil(params.username)) {
        const { lastUsernameUpdateAt } = request.boundUser;
        const minDateRequired = addDays(lastUsernameUpdateAt, USERNAME_CHANGE_MIN_DAYS);

        if (
            !isRoleOrHigher(request.user, UserRole.MODERATOR) &&
            !_.isNil(lastUsernameUpdateAt) &&
            minDateRequired > new Date()
        ) {
            throw new ApiError({
                error: `You are not allowed to update your username until ${minDateRequired.toUTCString()}`,
                code: 409,
            });
        }

        updateRequest.username = params.username;
        request.boundUser.lastUsernameUpdateAt = new Date();
    }

    // If the role is being updated some rule must be respected.
    // 1. You cannot change roles if you are not at least a moderator.
    // 2. You cannot change the role unless you are equal or higher to the new role.
    // 3. You cannot change the role if you are equal to the current users role.
    // 4. You cannot change the role of a admin.
    // 5. You cannot change your own role.
    // 6. Admins are exempt from the rules.
    if (!_.isNil(params.role)) {
        if (
            (!isRoleOrHigher(request.user, UserRole.MODERATOR) ||
                !isRoleOrHigher(request.user, params.role) ||
                !isRoleHigher(request.user, request.boundUser.role)) &&
            request.user.role !== UserRole.ADMIN
        ) {
            throw new ApiError({
                error: `You are not authorized to change the users role to ${params.role}`,
                code: 401,
            });
        } else if (request.user.role !== UserRole.ADMIN && request.user.id === request.boundUser.id) {
            throw new ApiError({
                error: 'You are not authorized to change your own role',
                code: 401,
            });
        } else {
            updateRequest.role = params.role;
        }
    }

    Object.assign(request.boundUser, updateRequest);
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
export async function deleteUser(request: UserRequest, response: Response) {
    const { boundUser: removingUser } = request;
    const { id: removingUserId } = removingUser;

    if (isRoleOrHigher(removingUser, UserRole.MODERATOR)) {
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

        // they are purged from the players and editors body.
        const gameApplications = await transaction.find(GameApplication, whereOptions);
        await transaction.remove(gameApplications);

        const userRelatedGames = await transaction
            .getRepository(Game)
            .createQueryBuilder('games')
            .select()
            .where("(storage ->> 'players')::json ->:id IS NOT NULL", { id: removingUserId })
            .getMany();

        for (const game of userRelatedGames) {
            const gameStorage = game?.storage;

            // Update the inner game players model to replace the removing user with the replacement
            // user. Since these will be rendered on the home page.
            if (!_.isNil(gameStorage?.players) && !_.isNil(gameStorage.players[removingUserId])) {
                const player = gameStorage.players[removingUserId];

                // Set the internal id of the player is 0, since the front end will process based on
                // the internal Id of 0, if we change the actual key id, then it does not support
                // multiple deleted users.
                gameStorage.players[removingUserId] = {
                    id: 0,
                    team: player.team,
                    username: 'Competitor',
                    avatarUrl: undefined,
                };
                await transaction.save(game);
            }
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

    if (leaderboards.length === 0 || leaderboards.length !== params.first) pagination.after = null;
    if (params.after === 0) pagination.before = null;

    return response.json({
        data: leaderboards,
        pagination,
    });
}
