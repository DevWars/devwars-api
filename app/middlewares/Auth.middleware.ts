import { NextFunction, Request, Response } from 'express';
import { getCustomRepository, InsertQueryBuilder } from 'typeorm';
import * as _ from 'lodash';

import { UserRole } from '../models/User';
import UserRepository from '../repository/User.repository';
import { AuthService } from '../services/Auth.service';

export const mustBeAuthenticated = async (request: Request, response: Response, next: NextFunction) => {
    const token = request.cookies.token;

    // if the token was not not provided then return that the given user is not authenticated.
    if (_.isNil(token)) return response.status(401).json({ error: 'invalid or no authentication token was provided' });

    // decode the given token, if the token is null, then the given token is no longer valid and should be rejected.
    const decodedToken = AuthService.VerifyAuthenticationToken(token);

    if (_.isNil(decodedToken))
        return response.status(401).json({ error: 'invalid or no authentication token was provided' });

    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findById(decodedToken.id);

    if (_.isNil(user) || user.token !== token)
        return response.status(401).json({ error: 'invalid or no authentication token was provided' });

    request.params.user = user;
    return next();
};

export const mustBeRole = (role: UserRole) => async (request: Request, response: Response, next: NextFunction) => {
    const token = request.cookies.token;
    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findByToken(token);

    if (user && role >= user.role) {
        return next();
    }

    response.status(403).json({
        error: 'Unauthorized',
    });
};
