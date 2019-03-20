import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import UserStats from '../../models/UserStats';
import UserRepository from '../../repository/User.repository';

export async function forUser(request: Request, response: Response) {
    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findOne(request.params.id);
    if (!user) return response.sendStatus(404);

    const stats = await userRepository.findStatsByUser(user);

    response.json(stats);
}

export async function create(request: Request, response: Response) {
    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findOne(request.params.id);
    if (!user) return response.sendStatus(400);

    const stats = new UserStats();
    stats.user = user;
    Object.assign(stats, request.body);

    await stats.save();
    response.json(stats);
}
