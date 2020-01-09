import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';
import { isNil } from 'lodash';

import { ICreateGameScheduleRequest, IUpdateGameScheduleRequest } from '../../request/IGameScheduleRequest';
import GameScheduleRepository from '../../repository/GameSchedule.repository';
import { IScheduleRequest } from '../../request/IRequest';

import GameSchedule from '../../models/GameSchedule';
import { GameStatus } from '../../models/GameSchedule';
import Game from '../../models/Game';

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
    const scheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedules = await scheduleRepository.all();

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
        mode: params.mode || '',
        objectives: objectives.reduce(toIdMap, {}),
        title: params.title || '',
    };

    await schedule.save();
    return response.json(flattenSchedule(schedule));
}

export async function activate(request: IScheduleRequest, response: Response) {
    const scheduleBody = request.body;

    if (request.schedule.status !== GameStatus.SCHEDULED) {
        return response.status(400).json({
            error: 'schedule cannot be activated since its not in a scheduled state.',
        });
    }

    if (!isNil(request.schedule.game)) {
        return response.status(400).json({
            error: 'schedule cannot be activated since game already exists',
        });
    }

    const game = new Game();

    game.schedule = request.schedule;
    game.season = request.schedule.setup.season || scheduleBody.season;
    game.mode = request.schedule.setup.mode || scheduleBody.mode;
    game.title = request.schedule.setup.title || scheduleBody.title;
    game.storage = {
        mode: game.mode,
        title: game.title,
        startTime: request.schedule.startTime || scheduleBody.startTime,
        objectives: request.schedule.setup.objectives || scheduleBody.objectives || {},
    };

    await game.save();

    // Update GameSchedule
    request.schedule.status = GameStatus.ACTIVE;

    // The just created game object cannot be bound to the schedule since this would create a
    // circular dependency based on the game having a link to the schedule object and the schedule
    // linking back ot the game. Thus requiring a new reference being created.
    request.schedule.game = new Game();
    request.schedule.game.id = game.id;
    await request.schedule.save();

    return response.json(flattenSchedule(request.schedule));
}
