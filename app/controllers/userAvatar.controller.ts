import { Response } from 'express';

import { AvatarService } from '../services/avatar.service';
import { UserRequest } from '../request/requests';
import ApiError from '../utils/apiError';

/**
 * @api {put} /users/:user/avatar Update the users avatar
 *
 * @apiVersion 1.0.0
 * @apiName UpdateUserAvatar
 * @apiGroup Users
 */
export async function updateUserAvatarById(request: UserRequest, response: Response) {
    try {
        await AvatarService.updateAvatarForUser(request.boundUser, request.file.path);
    } catch (e) {
        throw new ApiError({ error: "We couldn't upload your avatar", code: 400 });
    }

    return response.json(request.boundUser);
}
