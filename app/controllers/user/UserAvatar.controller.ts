import { Response } from 'express';

import { AvatarService } from '../../services/Avatar.service';
import { IUserRequest } from '../../request/IRequest';
import ApiError from '../../utils/apiError';

/**
 * @api {put} /users/:user/avatar Updates the avatar of the user.
 * @apiName UpdateUserAvatar
 * @apiGroup User 
 * @apiPermission Moderator, Owner
 * 
 * @apiParam {string} user The id of the user.
 * @apiParam {string} filePath The path of the avatar.
 * 
 * @apiParamExample {json} Request-Example:
 *      {
 *          "filePath": "http://lorempixel.com/640/480/nature",
 *      } 
 * 
 * @apiSuccess {number} id The id of the user.
 * @apiSuccess {datetime} updatedAt The time the user was last updated.
 * @apiSuccess {datetime} createdAt The time the user was created at.
 * @apiSuccess {datetime} lastSignIn The time the user last signed in.
 * @apiSuccess {string} email The email of the user.
 * @apiSuccess {string} username The username of the user.
 * @apiSuccess {string} password The password of the user.
 * @apiSuccess {string} role The role of the user. 
 * @apiSuccess {string} token The token of the user.
 * @apiSuccess {string} avatarUrl The avatar url of the user.
 * 
 * @apiSuccessExample {json} Success-Response:
 *      {
 *      "id": 5,
 *      "updatedAt": "2019-11-19T14:54:09.479Z",
 *      "createdAt": "2019-11-19T14:54:09.479Z",
 *      "lastSignIn": "2019-11-19T14:54:09.481Z",
 *      "email": "William_Rowe1@yahoo.com",
 *      "username": "Lelia_Boyer",
 *      "password": "password",
 *      "role": "MODERATOR",
 *      "token": "token",
 *      "avatarUrl": "http://lorempixel.com/640/480/nature",
 *      }
 */
export async function store(request: IUserRequest, response: Response) {
    try {
        await AvatarService.updateAvatarForUser(request.boundUser, request.file.path);
    } catch (e) {
        throw new ApiError({ error: "We couldn't upload your avatar", code: 400 });
    }

    return response.json(request.boundUser);
}
