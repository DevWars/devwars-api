import { NextFunction, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import { IUserRequest } from '../request/IRequest';
import UserRepository from '../repository/User.repository';
import { DATABASE_MAX_ID } from '../constants';
import { wrapAsync } from '../routes/handlers';
import ApiError from '../utils/apiError';

/**
 * Ensures that the requesting authorized user has provided a valid schedule id, this id will be validated,
 * gathered and bound to the request. Allowing future requests that implement this interface to
 * pull the schedule from the request object.
 */
export const bindUserFromUserParam = wrapAsync(
    async (request: IUserRequest, response: Response, next: NextFunction) => {
        const { user: userId } = request.params;

        if (_.isNil(userId) || isNaN(_.toNumber(userId)) || Number(userId) > DATABASE_MAX_ID)
            throw new ApiError({ code: 400, error: 'Invalid user id provided.' });

        const userRepository = getCustomRepository(UserRepository);
        const user = await userRepository.findById(userId);

        if (_.isNil(user)) {
            throw new ApiError({
                error: 'A user does not exist for the given id.',
                code: 404,
            });
        }

        request.boundUser = user;
        return next();
    }
);
