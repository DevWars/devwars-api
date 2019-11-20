import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';
import { isNil } from 'lodash';

import User from '../../models/User';
import { UserRole } from '../../models/User';
import UserRepository from '../../repository/User.repository';
import { IRequest, IUserRequest } from '../../request/IRequest';
import { hash } from '../../utils/hash';

interface IUpdateUserRequest {
    lastSigned: Date;
    email: string;
    username: string;
    password: string;
    role: UserRole;
    token: string;
}

/**
 * @api {get} /:user Request User basic information
 * @apiName GetUserById
 * @apiGroup User
 *
 * @apiParam {Number} user Users unique ID.
 *
 * @apiSuccess {string} username    the username of the User.
 * @apiSuccess {string} role        the role of the User.
 * @apiSuccess {number} id          the id of the User.
 * @apiSuccess {string} avatarUrl   the avatar url of the User.
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
 * @apiPermission administrator
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
    const users = await User.find();
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
        return response.status(409).send({
            message: 'The provided username already exists for a registered user.',
        });
    }

    // Ensure to encrypt the updated password if it has been specified.
    if (!isNil(params.password)) params.password = await hash(params.password);

    Object.assign(request.boundUser, params);
    await request.boundUser.save();

    return response.json(request.boundUser);
}
