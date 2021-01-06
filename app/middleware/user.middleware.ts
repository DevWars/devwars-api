import { NextFunction, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import { UserRequest } from '../request/requests';
import UserRepository from '../repository/user.repository';
import { DATABASE_MAX_ID } from '../constants';
import { wrapAsync } from '../routes/handlers';
import ApiError from '../utils/apiError';

export const bindUserById = (id: any, optional = false) =>
    wrapAsync(async (request: UserRequest, response: Response, next: NextFunction) => {
        if (_.isNil(id) && optional) return next();

        if (_.isNil(id) || isNaN(_.toNumber(id)) || Number(id) > DATABASE_MAX_ID)
            throw new ApiError({ code: 400, error: 'Invalid user id provided.' });

        const userRepository = getCustomRepository(UserRepository);
        const user = await userRepository.findById(id);

        // if the user does not exist, we cannot fulfil the complete request. SO lets
        // go and let the user know that the user does not exist and return out of
        // the request.
        if (_.isNil(user)) {
            throw new ApiError({
                error: 'A user does not exist for the given id.',
                code: 404,
            });
        }

        request.boundUser = user;
        next();
    });

/**
 * A middleware designed to automatically bind a given user that was specified
 * in the url paramter, this is used as a point of entry so that future
 * requests do not have to go through the process of ensuring that a given user
 * exists or not. If it made it to the request then the user exits.
 */
export const bindUserByParamId = (identifier = 'user', optional = false) => async (
    request: UserRequest,
    response: Response,
    next: NextFunction
) => bindUserById(request.params[identifier], optional)(request, response, next);

/**
 * A middleware designed to automatically bind a given user that was specified
 * in the url query, this is used as a point of entry so that future
 * requests do not have to go through the process of ensuring that a given user
 * exists or not. If it made it to the request then the user exits.
 */
export const bindUserByQueryId = (identifer = 'user', optional = false) => async (
    request: UserRequest,
    response: Response,
    next: NextFunction
) => bindUserById(request.query[identifer], optional)(request, response, next);
