import { getCustomRepository, getConnection } from 'typeorm';
import { Request, Response } from 'express';
import { isNil, isInteger } from 'lodash';

import GameApplication from '../../models/GameApplication';
import UserProfile from '../../models/UserProfile';
import UserStats from '../../models/UserStats';
import Activity from '../../models/Activity';

import UserRepository from '../../repository/User.repository';
import { IUserRequest } from '../../request/IRequest';
import { COMPETITOR_USERNAME } from '../../constants';
import { hash } from '../../utils/hash';

import { parseIntWithDefault } from '../../../test/helpers';
import { UserRole } from '../../models/User';
import User from '../../models/User';
import LinkedAccount from '../../models/LinkedAccount';
import PasswordReset from '../../models/PasswordReset';
import EmailVerification from '../../models/EmailVerification';
import UserGameStats from '../../models/UserGameStats';

import ApiError from '../../utils/apiError';

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
    let { username, limit } = request.query;

    if (isNil(username)) username = '';
    username = username.replace(/\s/g, '').trim();

    if (isNil(limit) || !isInteger(Number(limit)) || Number(limit) > 50) limit = 50;
    limit = Number(limit);

    if (username === '') {
        throw new ApiError({
            error: 'The specified username within the query must not be empty.',
            code: 400,
        });
    }

    const userRepository = getCustomRepository(UserRepository);
    const users = await userRepository.getUsersLikeUsername(username, limit);

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

    if (!isNil(existingUsername) && existingUsername.id !== request.boundUser.id) {
        throw new ApiError({
            error: 'The provided username already exists for a registered user.',
            code: 409,
        });
    }

    // Ensure to encrypt the updated password if it has been specified.
    if (!isNil(params.password)) params.password = await hash(params.password);

    Object.assign(request.boundUser, params);
    await request.boundUser.save();

    return response.json(request.boundUser);
}

/**
 * @api {delete} /:user Deletes the user from the system (replaces with competitor)
 * @apiName DeleteUserById
 * @apiGroup User
 * @apiPermission admin, owner
 *
 * @apiParam {Number} user Users unique ID.
 * @apiParam {string} [lastSigned] Users updated last signed in date.
 */
export async function deleteUser(request: IUserRequest, response: Response) {
    const { boundUser: removingUser } = request;

    await getConnection().transaction(async (transaction) => {
        const userRepository = transaction.getCustomRepository(UserRepository);
        const competitor = await userRepository.findByUsername(COMPETITOR_USERNAME);

        // The reserved user needs to exist before hand to ensure that the user can be removed and
        // there details are replaced with the template reserved user (competitor).
        if (competitor == null) throw Error('Users cannot be removed since a replacement user does not exist.');

        const whereOptions = { where: { user: removingUser } };

        // First remove all related activities for the given user. Since the user is being removed, any
        // action taken by the user is only related to a given user and should be removed (not replaced
        // by competitor).
        const activities = await transaction.find(Activity, whereOptions);
        await transaction.remove(activities);

        // Remove the given users related profile && users stats
        const profiles = await transaction.find(UserProfile, whereOptions);
        await transaction.remove(profiles);

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
            .where('game_schedule.startTime >= :after')
            .andWhere('app."userId" = :user')
            .setParameters({ after: new Date(), user: removingUser.id })
            .getMany();

        await transaction.remove(futureGameApplications);

        // For all applications that exist for the user, replace them with the replacement user
        // "Competitor", this is a pre-defined user to help with ensuring data is not damaged and
        // not usable since related users are missing.
        const gameApplications = await transaction.find(GameApplication, whereOptions);
        for (const application of gameApplications) {
            application.user = competitor;
            await application.save();
        }

        // // Finally delete the user.
        await transaction.remove(removingUser);
    });

    return response.json({ user: request.boundUser.id });
}
