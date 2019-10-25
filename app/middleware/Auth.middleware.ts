import { NextFunction, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import { UserRole } from '../models/User';
import UserRepository from '../repository/User.repository';
import { AuthService } from '../services/Auth.service';
import { IRequest } from '../request/IRequest';

export const mustBeAuthenticated = async (request: IRequest, response: Response, next: NextFunction) => {
    const token = request.cookies.token;

    // If the token was not not provided then return that the given user is not authenticated.
    if (_.isNil(token)) return response.status(401).json({ error: 'Invalid or no authentication token was provided.' });

    // Decode the given token, if the token is null, then the given token is no longer valid and should be rejected.
    const decodedToken = AuthService.VerifyAuthenticationToken(token);

    if (_.isNil(decodedToken))
        return response.status(401).json({ error: 'Invalid or no authentication token was provided.' });

    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findById(decodedToken.id);

    if (_.isNil(user) || user.token !== token)
        return response.status(401).json({ error: 'Invalid or no authentication token was provided.' });

    // Ensure that the user is correctly sanitized to remove the token, password and other core
    // properties. Since this is the current authenticated user, there is no need to remove any more
    // additional properties.
    request.user = user.toJSON();

    return next();
};

/**
 * Ensures that the requesting authorized user is at the provided minimal role before continuing the
 * request. This ensures that if a moderator role is required, then the request will not continue
 * otherwise.
 * @param role The minimal role the current authorized requesting user must be at.
 */
export const mustBeRole = (role: UserRole) => async (request: IRequest, response: Response, next: NextFunction) => {
    // If the authorized user does meet the minimal requirement of the role or greater, then the
    // request can continue as expected.
    if (role >= request.user.role) return next();

    // Otherwise ensure that the user is made aware that they are not meeting the minimal
    // requirements of the role.
    return response.status(403).json({
        error: 'Unauthorized, you currently don\'t meet the minimal role requirement.',
    });
};
