import { NextFunction, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import GameScheduleRepository from '../repository/GameSchedule.repository';
import { IScheduleRequest } from '../request/IRequest';
import { DATABASE_MAX_ID } from '../constants';
import { wrapAsync } from '../routes/handlers';
import ApiError from '../utils/apiError';

/**
 * Ensures that the requesting authorized user has provided a valid schedule id, this id will be validated,
 * gathered and bound to the request. Allowing future requests that implement this interface to
 * pull the schedule from the request object.
 */
export const bindScheduleFromScheduleParam = wrapAsync(
    async (request: IScheduleRequest, response: Response, next: NextFunction) => {
        const { schedule: scheduleId } = request.params;

        if (_.isNil(scheduleId) || isNaN(_.toNumber(scheduleId)) || Number(scheduleId) > DATABASE_MAX_ID)
            throw new ApiError({ code: 400, error: 'Invalid schedule id provided.' });

        const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
        const schedule = await gameScheduleRepository.findById(scheduleId);

        if (_.isNil(schedule))
            throw new ApiError({
                error: 'A game schedule does not exist for the given id.',
                code: 404,
            });

        request.schedule = schedule;
        return next();
    }
);
