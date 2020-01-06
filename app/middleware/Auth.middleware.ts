import { NextFunction, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import { UserRole } from '../models/User';
import UserRepository from '../repository/User.repository';
import { AuthService } from '../services/Auth.service';
import { IRequest } from '../request/IRequest';
import { wrapAsync } from '../routes/handlers';
import ApiError from '../utils/apiError';

export const mustBeAuthenticated = wrapAsync(async (request: IRequest, response: Response, next: NextFunction) => {
    const { token } = request.cookies;

    // If the token was not not provided then return that the given user is not authenticated.
    if (_.isNil(token)) throw new ApiError({ code: 401, error: 'Authentication token was not provided.' });

    // Decode the given token, if the token is null, then the given token is no longer valid and should be rejected.
    const decodedToken = AuthService.VerifyAuthenticationToken(token);

    if (_.isNil(decodedToken)) throw new ApiError({ code: 401, error: 'Invalid authentication token was provided.' });

    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findById(decodedToken.id);

    if (_.isNil(user) || user.token !== token)
        throw new ApiError({ code: 401, error: 'Expired authentication token was provided.' });

    // Ensure that the user is correctly sanitized to remove the token, password and other core
    // properties. Since this is the current authenticated user, there is no need to remove any more
    // additional properties.
    request.user = user;

    return next();
});

export const mustBeRole = (role?: UserRole, bot: boolean = false) =>
    wrapAsync(async (request: IRequest, response: Response, next: NextFunction) => {
        // If the requesting user must be a bot, ensure they are a bot, if they can only be a bot and
        // failed the check, ensure that we fail the request. Otherwise continue to role validation.
        if (bot && !_.isNil(request.body.apiKey)) {
            const apiKey = request.body.apiKey;
            if (apiKey === process.env.API_KEY) return next();
        }

        if (_.isNil(role) && bot) throw new ApiError({ code: 403, error: 'Unauthorized, invalid api key specified.' });

        // If the authorized user does meet the minimal requirement of the role or greater, then the
        // request can continue as expected.
        if (!_.isNil(request.user) && !_.isNil(role) && role >= request.user.role) return next();

        // Otherwise ensure that the user is made aware that they are not meeting the minimal
        // requirements of the role.
        throw new ApiError({ code: 403, error: "Unauthorized, you currently don't meet the minimal requirement." });
    });

/**
 *  mustOwnUser ensures that the current authenticated is the same entity as the one the following
 *  request is being performed on. e.g updating their own profile but not owners.
 */
export const mustBeRoleOrOwner = (role?: UserRole, bot: boolean = false) =>
    wrapAsync(async (request: IRequest, response: Response, next: NextFunction) => {
        const requestedUserId = Number(request.params.user);

        // Ensure that the requesting user is the entity they are also trying to perform the following
        // request on. For example: you can only update your own profile and not others (unless your a admin).
        if (!_.isNil(request.user) && request.user.id === requestedUserId) return next();
        return mustBeRole(role, bot)(request, response, next);
    });
