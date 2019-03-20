import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';
import GameApplicationFactory from '../../factory/GameApplication.factory';
import GameScheduleRepository from '../../repository/GameSchedule.repository';
import UserRepository from '../../repository/User.repository';

export async function apply(request: Request, response: Response) {
    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findByToken(request.cookies.auth);

    const gameScheduleRepository = await getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(request.params.schedule);

    if (!schedule || !user) return response.sendStatus(404);

    const application = await GameApplicationFactory.withScheduleAndUser(schedule, user).save();
    return response.json(application);
}

export async function applyByUsername(request: Request, response: Response) {
    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findByUsername(request.params.username);

    const gameScheduleRepository = await getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(request.params.schedule);

    if (!schedule || !user) return response.sendStatus(404);

    const applications = await GameApplicationFactory.withScheduleAndUser(schedule, user).save();
    return response.json(applications);
}

export async function findBySchedule(request: Request, response: Response) {
    const gameScheduleRepository = await getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(request.params.schedule);
    if (!schedule) return response.sendStatus(404);

    const userRepository = await getCustomRepository(UserRepository);
    const applications = await userRepository.findApplicationsBySchedule(schedule);

    response.json(applications);
}

export async function mine(request: Request, response: Response) {
    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findByToken(request.cookies.auth);

    const gameScheduleRepository = await getCustomRepository(GameScheduleRepository);
    const applications = await gameScheduleRepository.findApplicationsByUser(user);

    response.json(applications);
}

export async function entered(request: Request, response: Response) {
    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findByToken(request.cookies.auth);

    // const applications = await user.playedGames();

    // response.json(applications);
}
