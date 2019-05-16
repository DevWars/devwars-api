import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';
import GameApplicationFactory from '../../factory/GameApplication.factory';
import GameScheduleRepository from '../../repository/GameSchedule.repository';
import GameRepository from '../../repository/Game.repository';
import GameApplicationRepository from '../../repository/GameApplication.repository';
import UserRepository from '../../repository/User.repository';

export async function mine(request: Request, response: Response) {
    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findByToken(request.cookies.auth);

    const gameApplicationRepository = await getCustomRepository(GameApplicationRepository);
    const applications = await gameApplicationRepository.findByUser(user);

    response.json(applications);
}

export async function apply(request: Request, response: Response) {
    const scheduleId = request.params.schedule;

    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findByToken(request.cookies.auth);

    const gameScheduleRepository = await getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(scheduleId);

    if (!schedule || !user) return response.sendStatus(404);

    const application = await GameApplicationFactory.withScheduleAndUser(schedule, user).save();
    return response.json(application);
}

export async function resign(request: Request, response: Response) {
    const scheduleId = request.params.schedule;

    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findByToken(request.cookies.auth);

    const gameScheduleRepository = await getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(scheduleId);

    if (!schedule || !user) return response.sendStatus(404);

    const gameApplicationRepository = await getCustomRepository(GameApplicationRepository);
    const deleteApplication = await gameApplicationRepository.delete({ user, schedule });

    return response.json(deleteApplication);
}

export async function findBySchedule(request: Request, response: Response) {
    const scheduleId = request.params.schedule;

    const gameScheduleRepository = await getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(scheduleId);
    if (!schedule) return response.sendStatus(404);

    const userRepository = await getCustomRepository(UserRepository);
    const applications = await userRepository.findApplicationsBySchedule(schedule);

    response.json(applications);
}

export async function findByGame(request: Request, response: Response) {
    const gameId = request.params.game;

    const gameRepository = await getCustomRepository(GameRepository);
    const game = await gameRepository.findOne(gameId);

    const gameScheduleRepository = await getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findByGame(game);

    if (!schedule) return response.sendStatus(404);

    const userRepository = await getCustomRepository(UserRepository);
    const applications = await userRepository.findApplicationsBySchedule(schedule);

    response.json(applications);
}
