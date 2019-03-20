import { NextFunction, Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';

import { UserRole } from '../models/User';
import UserRepository from '../repository/User.repository';

export const mustOwnUser = async (request: Request, response: Response, next: NextFunction) => {
    const token = request.cookies.auth;
    const userRepository = await getCustomRepository(UserRepository);
    const user = await userRepository.findByToken(token);

    const requestedUserId = Number(request.params.id);
    if (user && user.id !== requestedUserId && user.role !== UserRole.ADMIN) {
        return response.sendStatus(401);
    }

    return next();
};
