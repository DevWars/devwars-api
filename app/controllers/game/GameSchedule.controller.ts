import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';
import * as _ from 'lodash';

import { CreateGameScheduleRequest, UpdateGameScheduleRequest } from '../../request/IGameScheduleRequest';
import GameScheduleRepository from '../../repository/GameSchedule.repository';
import { ScheduleRequest } from '../../request/IRequest';

import GameSchedule, { GameStatus } from '../../models/GameSchedule';
import ApiError from '../../utils/apiError';
import { parseIntWithDefault, parseEnumFromValue, parseStringWithDefault } from '../../../test/helpers';
import PaginationService from '../../services/pagination.service';

function flattenSchedule(schedule: GameSchedule): any {
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

export async function show(request: ScheduleRequest, response: Response) {
    return response.json(flattenSchedule(request.schedule));
}

/**
 * @api {get} /schedules?status=:status Get schedules
 * @apiDescription Gets all the given schedules.
 * format.
 * @apiName GetSchedules
 * @apiVersion 1.0.0
 * @apiGroup Schedules
 *
 * @apiParam {number {1..100}} [first=20] The number of games to return for the given page.
 * @apiParam {number {0..}} [after=0] The point of which the games should be gathered after.
 * @apiParam {string=scheduled,active,ended} [status] The optional game status to filter by.
 *
 * @apiSuccess {Schedule[]} data The related games based on the provided season and page range.
 * @apiSuccess {object} pagination The paging information to continue forward or backward.
 * @apiSuccess {string} pagination.next The next page in the paging of the data.
 * @apiSuccess {string} pagination.previous The previous page in the paging of the data.
 *
 * @apiSuccessExample Success-Response: HTTP/1.1 200 OK
 * {
 *   "data": [
 *     { ... }
 *   ],
 *   "pagination": {
 *     "next": "bmV4dF9fODM=",
 *      "previous": null
 *   }
 * }
 */
export async function getAllSchedulesWithPaging(request: Request, response: Response) {
    const { after, before, first, status: queryStatus } = request.query;

    const status = parseStringWithDefault(queryStatus, null);

    const params = {
        first: parseIntWithDefault(first, 20, 1, 100),
        status: parseEnumFromValue(GameStatus, _.isNil(status) ? status : status.toUpperCase(), null),
    };

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const where: any = {};

    if (!_.isNil(params.status)) where.status = params.status;

    const result = await PaginationService.pageRepository<GameSchedule>(
        gameScheduleRepository,
        params.first,
        after as string,
        before as string,
        'id',
        true,
        [],
        where
    );

    result.data = _.map(result.data, (schedule) => flattenSchedule(schedule));
    return response.json(result);
}

export async function update(request: ScheduleRequest, response: Response) {
    const params = { ...(request.body as UpdateGameScheduleRequest) };

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
 * @apiSuccess {schedule} schedule The given schedule has been ended.
 *
 * @apiError ScheduleIdNotDefined Invalid schedule id provided.
 * @apiError GameScheduleDoesNotExist A game schedule does not exist by the provided id.
 * @apiError GameScheduleActive The ending games schedule is already ended.
 */
export async function endScheduleById(request: ScheduleRequest, response: Response) {
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
 * @apiSuccess {schedule} schedule The given schedule has been deleted.
 *
 * @apiError ScheduleIdNotDefined Invalid schedule id provided.
 * @apiError GameScheduleDoesNotExist A game schedule does not exist by the provided id.
 * @apiError GameScheduleActive The deleting games schedule is active and cannot be deleted.
 */
export async function deleteScheduleById(request: ScheduleRequest, response: Response) {
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
    const params = { ...(request.body as CreateGameScheduleRequest) };

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

export async function activate(request: ScheduleRequest, response: Response) {
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
