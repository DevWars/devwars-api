import { Response } from 'express';

import { AvatarService } from '../../services/Avatar.service';
import { IUserRequest } from '../../request/IRequest';
import ApiError from '../../utils/apiError';

export async function store(request: IUserRequest, response: Response) {
    try {
        await AvatarService.updateAvatarForUser(request.boundUser, request.file.path);
    } catch (e) {
        throw new ApiError({ error: "We couldn't upload your avatar", code: 400 });
    }

    return response.json(request.boundUser);
}
