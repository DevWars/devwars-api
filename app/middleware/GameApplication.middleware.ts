import { NextFunction, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import GameScheduleRepository from '../repository/GameSchedule.repository';
import { IGameRequest, IScheduleRequest } from '../request/IRequest';
import GameRepository from '../repository/Game.repository';

/**
 * Ensures that the requesting authorized user has provided a valid schedule id, this id will be validated,
 * gathered and bound to the request. Allowing future requests that implement this interface to
 * pull the schedule from the request object.
 */
export const bindGameScheduleFromScheduleParam = async (
    request: IScheduleRequest,
    response: Response,
    next: NextFunction
) => {
    const { schedule: scheduleId } = request.params;

    if (_.isNil(scheduleId)) {
        return response.status(400).json({ error: 'Invalid schedule id provided.' });
    }

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(scheduleId, { relations: ['game'] });

    if (_.isNil(schedule)) {
        return response.sendStatus(404).json({
            error: 'A game schedule does not exist for the given id.',
        });
    }

    request.schedule = schedule;
    return next();
};

/**
 * Ensures that the requesting authorized user has provided a valid schedule id, this id will be validated,
 * gathered and bound to the request. Allowing future requests that implement this interface to
 * pull the schedule from the request object.
 */
export const bindGameFromGameParam = async (request: IGameRequest, response: Response, next: NextFunction) => {
    const { game: gameId } = request.params;

    if (_.isNil(gameId)) {
        return response.status(400).json({
            error: 'Invalid game id provided.',
        });
    }

    const gameRepository = getCustomRepository(GameRepository);
    const game = await gameRepository.findOne(gameId, { relations: ['schedule'] });

    if (_.isNil(game)) {
        return response.status(404).json({
            error: 'A game does not exist by the provided game id.',
        });
    }

    request.game = game;
    return next();
};
