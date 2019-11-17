import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';
import { ICreateGameScheduleRequest, IUpdateGameScheduleRequest } from '../../request/IGameScheduleRequest';

import GameSchedule from '../../models/GameSchedule';
import Game from '../../models/Game';
import { GameStatus } from '../../models/GameSchedule';
import GameScheduleRepository from '../../repository/GameSchedule.repository';
import { IScheduleRequest } from '../../request/IRequest';

function flattenSchedule(schedule: GameSchedule) {
    return {
        ...schedule.setup,
        id: schedule.id,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        startTime: schedule.startTime,
        status: schedule.status,
        game: schedule.game,
    };
}

export async function show(request: IScheduleRequest, response: Response) {
    return response.json(flattenSchedule(request.schedule));
}

export async function all(request: Request, response: Response) {
    const schedules = await GameSchedule.find({
        order: { startTime: 'ASC' },
        relations: ['game'],
    });

    return response.json(schedules.map((schedule) => flattenSchedule(schedule)));
}

export async function update(request: IScheduleRequest, response: Response) {
    const params = { ...(request.body as IUpdateGameScheduleRequest) };

    request.schedule.startTime = params.startTime || request.schedule.startTime;
    request.schedule.setup = {
        ...request.schedule.setup,
        mode: params.mode || request.schedule.setup.mode,
        title: params.title || request.schedule.setup.title,
        objectives: params.objectives || request.schedule.setup.objectives,
    };

    await request.schedule.save();

    return response.json(flattenSchedule(request.schedule));
}

export async function latest(request: Request, response: Response) {
    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const latestSchedule = await gameScheduleRepository.latest();
    if (!latestSchedule) return response.sendStatus(404);

    return response.json(flattenSchedule(latestSchedule));
}

export async function byStatus(request: Request, response: Response) {
    const toEnum: string = (request.params.status || '').toUpperCase();
    const status: GameStatus = (GameStatus as any)[toEnum];

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedules = await gameScheduleRepository.findAllByStatus(status);

    return response.json(schedules.map((schedule) => flattenSchedule(schedule)));
}

export async function create(request: Request, response: Response) {
    const params = { ...(request.body as ICreateGameScheduleRequest) };

    const schedule = new GameSchedule();
    const objectives = [];

    for (let id = 1; id <= 5; id++) {
        objectives.push({
            id,
            description: '',
            isBonus: id === 5,
        });
    }
    const toIdMap = (result: any, obj: { id: number }) => {
        result[obj.id] = obj;
        return result;
    };

    schedule.startTime = params.startTime || schedule.startTime;

    schedule.setup = {
        ...schedule.setup,
        mode: params.mode || schedule.setup.mode,
        objectives: objectives.reduce(toIdMap, {}),
        title: params.title || schedule.setup.title,
    };

    await schedule.save();
    return response.json(flattenSchedule(schedule));
}

export async function activate(request: IScheduleRequest, response: Response) {
    const schedule = request.schedule;

    // Create the Game
    const game = new Game();
    game.season = schedule.setup.season;
    game.mode = schedule.setup.mode;
    game.title = schedule.setup.title;
    game.storage = {
        mode: game.mode,
        title: game.title,
        startTime: schedule.startTime,
        objectives: schedule.setup.objectives || {},
    };

    const savedGame = await game.save();

    // Update GameSchedule
    request.schedule.game = savedGame;
    request.schedule.status = GameStatus.ACTIVE;
    await request.schedule.save();

    // On Game.controller get applications from the Schedule
    // - find GameSchedule with the same GameId

    return response.json(flattenSchedule(request.schedule));
}
