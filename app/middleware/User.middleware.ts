import { NextFunction, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import { IUserRequest } from '../request/IRequest';
import UserRepository from '../repository/User.repository';
import { DATABASE_MAX_ID } from '../constants';

/**
 * Ensures that the requesting authorized user has provided a valid schedule id, this id will be validated,
 * gathered and bound to the request. Allowing future requests that implement this interface to
 * pull the schedule from the request object.
 */
export const bindUserFromUserParam = async (request: IUserRequest, response: Response, next: NextFunction) => {
    const { user: userId } = request.params;

    if (_.isNil(userId) || isNaN(_.toNumber(userId)) || Number(userId) > DATABASE_MAX_ID) {
        return response.status(400).json({ error: 'Invalid user id provided.' });
    }

    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findById(userId);

    if (_.isNil(user)) {
        return response.status(404).json({
            error: 'A user does not exist for the given id.',
        });
    }

    request.boundUser = user;
    return next();
};
