import { NextFunction, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import { GameRequest } from '../request/requests';
import GameRepository from '../repository/game.repository';
import { DATABASE_MAX_ID } from '../constants';
import { wrapAsync } from '../routes/handlers';
import ApiError from '../utils/apiError';
import { parseIntWithDefault } from '../utils/helpers';

export const bindGameById = (id: any) =>
    wrapAsync(async (request: GameRequest, response: Response, next: NextFunction) => {
        const gameId = parseIntWithDefault(id, null, 1, DATABASE_MAX_ID);

        if (_.isNil(gameId)) throw new ApiError({ code: 400, error: 'Invalid game id provided.' });

        const gameRepository = getCustomRepository(GameRepository);
        const game = await gameRepository.findOne(gameId);

        if (_.isNil(game)) throw new ApiError({ code: 404, error: 'A game does not exist by the provided game id.' });

        request.game = game;
        return next();
    });

/**
 * A middleware designed to automatically bind a given game that was specified
 * in the url paramter, this is used as a point of entry so that future
 * requests do not have to go through the process of ensuring that a given game
 * exists or not. If it made it to the request then the game exits.
 */
export const bindGameByParamId = (identifier = 'game') => async (
    request: GameRequest,
    response: Response,
    next: NextFunction
) => bindGameById(request.params[identifier])(request, response, next);

/**
 * A middleware designed to automatically bind a given game that was specified
 * in the url query, this is used as a point of entry so that future
 * requests do not have to go through the process of ensuring that a given game
 * exists or not. If it made it to the request then the game exits.
 */
export const bindGameByQueryId = (identifer = 'game') => async (
    request: GameRequest,
    response: Response,
    next: NextFunction
) => bindGameById(request.query[identifer])(request, response, next);
