import { NextFunction, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import { IGameRequest } from '../request/IRequest';
import GameRepository from '../repository/Game.repository';
import { DATABASE_MAX_ID } from '../constants';
import { wrapAsync } from '../routes/handlers';
import ApiError from '../utils/apiError';

/**
 * Ensures that the requesting authorized user has provided a valid schedule id, this id will be validated,
 * gathered and bound to the request. Allowing future requests that implement this interface to
 * pull the schedule from the request object.
 */
export const bindGameFromGameParam = wrapAsync(
    async (request: IGameRequest, response: Response, next: NextFunction) => {
        const { game: gameId } = request.params;

        if (_.isNil(gameId) || isNaN(_.toNumber(gameId)) || Number(gameId) > DATABASE_MAX_ID)
            throw new ApiError({ code: 400, error: 'Invalid game id provided.' });

        const gameRepository = getCustomRepository(GameRepository);
        const game = await gameRepository.findOne(gameId, { relations: ['schedule'] });

        if (_.isNil(game)) throw new ApiError({ code: 404, error: 'A game does not exist by the provided game id.' });

        request.game = game;
        return next();
    }
);
