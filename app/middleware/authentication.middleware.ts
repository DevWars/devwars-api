import { NextFunction, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import User, { UserRole } from '../models/user.model';
import UserRepository from '../repository/user.repository';
import { AuthService } from '../services/auth.service';
import { AuthorizedRequest } from '../request/requests';
import { wrapAsync } from '../routes/handlers';
import ApiError from '../utils/apiError';

import { isRoleOrHigher } from '../controllers/authentication.controller';

export const mustBeAuthenticated = wrapAsync(
    async (request: AuthorizedRequest, response: Response, next: NextFunction) => {
        const { token } = request.cookies;

        // Allow and assign dummy user if API_KEY was provided.
        if (process.env.API_KEY && request.headers?.apikey === process.env.API_KEY) {
            // Dummy user used to bypass middleware down the stack. The mustBeMinimumRole has a special flag for
            // allowing apiKeys so the user role is kept to a minimum just in case.
            request.user = new User('API_KEY', process.env.API_KEY, 'api@devwars.tv', UserRole.USER);
            request.user.id = -1;

            return next();
        }

        if (_.isNil(token)) {
            // If the token was not not provided then return that the given user
            // is not authenticated.
            throw new ApiError({
                error: 'Authentication token was not provided.',
                code: 401,
            });
        }
        // Decode the given token, if the token is null, then the given token is no longer valid and should be rejected.
        const decodedToken = AuthService.VerifyAuthenticationToken(token);

        if (_.isNil(decodedToken))
            throw new ApiError({
                code: 401,
                error: 'Invalid authentication token was provided.',
            });

        const userRepository = getCustomRepository(UserRepository);
        const user = await userRepository.findById(decodedToken.id);

        if (_.isNil(user) || user.token !== token)
            throw new ApiError({ code: 401, error: 'Expired authentication token was provided.' });

        // Ensure that the user is correctly sanitized to remove the token, password and other core
        // properties. Since this is the current authenticated user, there is no need to remove any more
        // additional properties.
        request.user = user;

        return next();
    }
);

export const mustBeMinimumRole = (role?: UserRole, allowApiKey = false) =>
    wrapAsync(async (request: AuthorizedRequest, response: Response, next: NextFunction) => {
        // The apiKey dummy user should have the apiKey set on the password field.
        if (allowApiKey && request?.user?.password === process.env.API_KEY) {
            return next();
        }

        if (_.isNil(role) && allowApiKey) throw new ApiError({ code: 403, error: 'Unauthorized, invalid api key specified.' });

        // If the authorized user does meet the minimal requirement of the role or greater, then the
        // request can continue as expected.
        if (!_.isNil(request.user) && !_.isNil(role) && isRoleOrHigher(request.user, role)) return next();

        // Otherwise ensure that the user is made aware that they are not meeting the minimal
        // requirements of the role.
        throw new ApiError({ code: 403, error: "Unauthorized, you currently don't meet the minimal requirement." });
    });

/**
 *  mustOwnUser ensures that the current authenticated is the same entity as the one the following
 *  request is being performed on. e.g updating their own profile but not owners.
 */
export const mustBeRoleOrOwner = (role?: UserRole, bot = false) =>
    wrapAsync(async (request: AuthorizedRequest, response: Response, next: NextFunction) => {
        const requestedUserId = Number(request.params.user);

        // Ensure that the requesting user is the entity they are also trying to perform the following
        // request on. For example: you can only update your own profile and not others (unless your a admin).
        if (!_.isNil(request.user) && request.user.id === requestedUserId) return next();
        return mustBeMinimumRole(role, bot)(request, response, next);
    });
