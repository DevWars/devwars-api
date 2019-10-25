import { Response } from 'express';

import { AvatarService } from '../../services/Avatar.service';
import { IRequest } from '../../request/IRequest';

export async function store(request: IRequest, response: Response) {
    try {
        await AvatarService.updateAvatarForUser(request.user, request.file.path);
    } catch (e) {
        return response.status(400).json({ error: "We couldn't upload your avatar" });
    }

    return response.json(request.user);
}
