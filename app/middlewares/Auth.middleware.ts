import { NextFunction, Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';

import { UserRole } from '../models/User';
import UserRepository from '../repository/User.repository';

export const mustBeAuthenticated = async (request: Request, response: Response, next: NextFunction) => {
    const token = request.cookies.token;
    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findByToken(token);

    if (user) {
        return next();
    }

    response.status(401).json({
        error: 'Unauthenticated',
    });
};

export const mustBeRole = (role: UserRole) => async (request: Request, response: Response, next: NextFunction) => {
    const token = request.cookies.token;
    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findByToken(token);

    if (user && role >= user.role) {
        return next();
    }

    response.status(403).json({
        error: 'Unauthorized',
    });
};
