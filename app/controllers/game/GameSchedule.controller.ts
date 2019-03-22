import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';

import GameSchedule from '../../models/GameSchedule';
import { GameStatus } from '../../models/GameSchedule';
import GameScheduleRepository from '../../repository/GameSchedule.repository';
import GameService from '../../services/Game.service';

interface IUpdateGameScheduleRequest {
    lastSigned: Date;
}

export async function show(request: Request, response: Response) {
    const scheduleId = request.params.id;
    const schedule = await GameSchedule.findOne(scheduleId);
    if (!schedule) return response.sendStatus(404);

    response.json(schedule);
}

export async function all(request: Request, response: Response) {
    const schedules = await GameSchedule.find();

    response.json(schedules);
}

export async function update(request: Request, response: Response) {
    const scheduleId = request.params.id;
    const params = request.body as IUpdateGameScheduleRequest;

    const schedule = await GameSchedule.findOne(scheduleId);
    if (!schedule) return response.sendStatus(404);

    Object.assign(schedule, params);
    await schedule.save();

    if (schedule.status === GameStatus.ACTIVE) {
        // await GameService.sendGameToFirebase(schedule);
    }

    response.json(schedule);
}

export async function latest(request: Request, response: Response) {
    const gameScheduleRepository = await getCustomRepository(GameScheduleRepository);
    const latestSchedule = await gameScheduleRepository.latest();
    if (!latestSchedule) return response.sendStatus(404);

    response.json(latestSchedule);
}

export async function byStatus(request: Request, response: Response) {
    const toEnum: string = (request.params.status || '').toUpperCase();
    const status: GameStatus = (GameStatus as any)[toEnum];

    const gameScheduleRepository = await getCustomRepository(GameScheduleRepository);
    const schedules = await gameScheduleRepository.findAllByStatus(status);

    response.json(schedules);
}

export async function create(request: Request, response: Response) {
    const { timestamp, mode, title, objectives } = request.body;
    const schedule = new GameSchedule();

    schedule.startTime = new Date(timestamp);
    schedule.setup = {
        mode,
        title,
        objectives,
    };

    await schedule.save();

    response.json(schedule);
}
