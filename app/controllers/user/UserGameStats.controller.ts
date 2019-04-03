import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import UserGameStats from '../../models/UserGameStats';
import UserRepository from '../../repository/User.repository';

export async function forUser(request: Request, response: Response) {
    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findOne(request.params.id);
    if (!user) return response.sendStatus(404);

    const stats = await userRepository.findGameStatsByUser(user);

    response.json(stats);
}
