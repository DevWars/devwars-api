import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import UserRepository from '../../repository/User.repository';
import { AvatarService } from '../../services/Avatar.service';

export async function store(request: Request, response: Response) {
    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findByToken(request.cookies.token);

    try {
        await AvatarService.updateAvatarForUser(user, request.file.path);
    } catch (e) {
        response.json({
            error: "We couldn't upload your avatar",
        });
    }

    response.json(user);
}
