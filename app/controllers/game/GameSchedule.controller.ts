import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';
import * as _ from 'lodash';

import { ICreateGameScheduleRequest, IUpdateGameScheduleRequest } from '../../request/IGameScheduleRequest';
import GameScheduleRepository from '../../repository/GameSchedule.repository';
import { IScheduleRequest } from '../../request/IRequest';

import GameSchedule from '../../models/GameSchedule';
import { GameStatus } from '../../models/GameSchedule';
import ApiError from '../../utils/apiError';

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
        templates: params.templates || request.schedule.setup.templates,
    };

    await request.schedule.save();

    return response.json(flattenSchedule(request.schedule));
}

/**
 * @api {post} /:schedule/end Ends a schedule by a Id
 * @apiDescription Ends a given schedule by the provided id.
 * @apiVersion 1.0.0
 * @apiName EndsScheduleById
 * @apiGroup GameSchedule
 *
 * @apiParam {number} schedule The id of the schedule that is being ended.
 *
 * @apiSuccess {200} The given schedule has been ended.
 *
 * @apiError ScheduleIdNotDefined Invalid schedule id provided.
 * @apiError GameScheduleDoesNotExist A game schedule does not exist by the provided id.
 * @apiError GameScheduleActive The ending games schedule is already ended.
 */
export async function endScheduleById(request: IScheduleRequest, response: Response) {
    if (request.schedule.status === GameStatus.ENDED) {
        throw new ApiError({
            error: 'Schedule cannot be ended since its not in a active state.',
            code: 400,
        });
    }

    request.schedule.status = GameStatus.ENDED;
    await request.schedule.save();

    return response.status(200).send();
}

/**
 * @api {delete} /:schedule Delete a schedule by a Id
 * @apiDescription Deletes a given schedule by the provided id.
 * @apiVersion 1.0.0
 * @apiName DeleteScheduleById
 * @apiGroup GameSchedule
 *
 * @apiParam {number} schedule The id of the schedule that is being deleted.
 *
 * @apiSuccess {202} The given schedule has been deleted.
 *
 * @apiError ScheduleIdNotDefined Invalid schedule id provided.
 * @apiError GameScheduleDoesNotExist A game schedule does not exist by the provided id.
 * @apiError GameScheduleActive The deleting games schedule is active and cannot be deleted.
 */
export async function deleteScheduleById(request: IScheduleRequest, response: Response) {
    if (request.schedule.status === GameStatus.ACTIVE) {
        throw new ApiError({
            error: 'Schedule cannot be deleted since its not in a scheduled state.',
            code: 400,
        });
    }

    if (!_.isNil(request.schedule.game)) {
        throw new ApiError({
            error: 'Schedule cannot be deleted since it has a related game.',
            code: 400,
        });
    }

    await request.schedule.remove();
    return response.status(202).send();
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

    const schedule = new GameSchedule(params.startTime, GameStatus.SCHEDULED, {
        mode: params.mode || '',
        objectives: params.objectives || {},
        templates: params.templates || {},
        title: params.title || '',
        season: 3,
    });

    await schedule.save();
    return response.json(flattenSchedule(schedule));
}

export async function activate(request: IScheduleRequest, response: Response) {
    if (request.schedule.status !== GameStatus.SCHEDULED) {
        throw new ApiError({
            error: 'schedule cannot be activated since its not in a scheduled state.',
            code: 400,
        });
    }

    if (!_.isNil(request.schedule.game)) {
        throw new ApiError({
            error: 'schedule cannot be activated since game already exists',
            code: 400,
        });
    }

    // Update GameSchedule
    request.schedule.status = GameStatus.ACTIVE;
    await request.schedule.save();

    return response.json(flattenSchedule(request.schedule));
}
