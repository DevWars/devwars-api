import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import UserStats from '../../models/UserStats';
import UserRepository from '../../repository/User.repository';

export async function forUser(request: Request, response: Response) {
    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findOne(request.params.user.id);
    if (!user) return response.status(404).json({ message: 'User not found' });

    const stats = await userRepository.findStatsByUser(user);
    if (stats.length === 0) {
        return response.status(404).json({
            message: 'Not stats found for user',
        });
    }

    response.json(stats);
}

export async function create(request: Request, response: Response) {
    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findOne(request.params.user.id);
    if (user) return response.status(400).json({ message: 'User already exists' });

    const stats = new UserStats();
    stats.user = user;
    Object.assign(stats, request.body);

    await stats.save();
    response.json(stats);
}
