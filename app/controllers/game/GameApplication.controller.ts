import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';
import GameApplicationFactory from '../../factory/GameApplication.factory';
import GameScheduleRepository from '../../repository/GameSchedule.repository';
import GameRepository from '../../repository/Game.repository';
import GameApplicationRepository from '../../repository/GameApplication.repository';
import UserRepository from '../../repository/User.repository';
import GameApplication from '../../models/GameApplication';

import { IRequest } from '../../request/IRequest';

import * as _ from 'lodash';

export async function mine(request: IRequest, response: Response) {
    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
    const applications = await gameApplicationRepository.findByUser(request.user);

    response.json(applications);
}

export async function apply(request: IRequest, response: Response) {
    const scheduleId = request.params.schedule;

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(scheduleId);

    if (_.isNil(schedule)) return response.sendStatus(404);

    const application = await GameApplicationFactory.withScheduleAndUser(schedule, request.user).save();
    return response.json(application);
}

export async function resign(request: IRequest, response: Response) {
    const scheduleId = request.params.schedule;

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(scheduleId);

    if (_.isNil(schedule)) return response.sendStatus(404);

    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
    const deleteApplication = await gameApplicationRepository.delete({ user: request.user, schedule });

    return response.json(deleteApplication);
}

export async function findBySchedule(request: Request, response: Response) {
    const scheduleId = request.params.schedule;

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(scheduleId);

    if (_.isNil(schedule)) return response.sendStatus(404);

    const userRepository = getCustomRepository(UserRepository);
    const applications = await userRepository.findApplicationsBySchedule(schedule);

    response.json(applications);
}

export async function findByGame(request: Request, response: Response) {
    const gameId = request.params.game;

    const gameRepository = getCustomRepository(GameRepository);
    const game = await gameRepository.findOne(gameId);

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findByGame(game);

    if (_.isNil(schedule)) return response.sendStatus(404);

    const userRepository = getCustomRepository(UserRepository);
    const applications = await userRepository.findApplicationsBySchedule(schedule);

    response.json(applications);
}

export async function create(request: IRequest, response: Response) {
    const gameId = request.params.game;
    const username = request.params.username;

    const gameRepository = getCustomRepository(GameRepository);
    const game = await gameRepository.findOne(gameId);

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findByGame(game);

    if (_.isNil(schedule)) return response.sendStatus(404);

    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findByUsername(username);

    if (_.isNil(user)) return response.sendStatus(404);

    const application = new GameApplication();
    application.schedule = schedule;
    application.user = user;

    await application.save();

    response.json(application);
}
