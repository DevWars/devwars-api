import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';

import UserRepository from '../../repository/User.repository';

export async function forUser(request: Request, response: Response) {
    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findOne(request.params.id);
    if (!user) return response.sendStatus(404);

    const stats = await userRepository.findGameStatsByUser(user);
    return response.json(stats);
}
