import { NextFunction, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import GameScheduleRepository from '../repository/GameSchedule.repository';
import { IScheduleRequest } from '../request/IRequest';
import { DATABASE_MAX_ID } from '../constants';

/**
 * Ensures that the requesting authorized user has provided a valid schedule id, this id will be validated,
 * gathered and bound to the request. Allowing future requests that implement this interface to
 * pull the schedule from the request object.
 */
export const bindScheduleFromScheduleParam = async (
    request: IScheduleRequest,
    response: Response,
    next: NextFunction
) => {
    const { schedule: scheduleId } = request.params;

    if (_.isNil(scheduleId) || isNaN(_.toNumber(scheduleId)) || Number(scheduleId) > DATABASE_MAX_ID) {
        return response.status(400).json({ error: 'Invalid schedule id provided.' });
    }

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findById(scheduleId);

    if (_.isNil(schedule)) {
        return response.status(404).json({
            error: 'A game schedule does not exist for the given id.',
        });
    }

    request.schedule = schedule;
    return next();
};
