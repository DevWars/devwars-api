import { Response } from 'express';

import { AvatarService } from '../../services/Avatar.service';
import { IUserRequest } from '../../request/IRequest';

export async function store(request: IUserRequest, response: Response) {
    try {
        await AvatarService.updateAvatarForUser(request.boundUser, request.file.path);
    } catch (e) {
        return response.status(400).json({ error: "We couldn't upload your avatar" });
    }

    return response.json(request.boundUser);
}
