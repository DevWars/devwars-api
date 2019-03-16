import {NextFunction, Request, Response} from 'express';

import {UserRole} from '../models';
import {UserRepository} from '../repository';

export const mustOwnUser = async (request: Request, response: Response, next: NextFunction) => {
    const token = request.cookies.auth;
    const user = await UserRepository.userForToken(token);

    if (!user) {
        return response.status(404).json({
            message: 'That user does not exist',
        });
    }

    const requestedUserId = parseInt(request.params.user, 10);

    if (user.id !== requestedUserId && user.role !== UserRole.ADMIN) {
        return response.status(403).json({
            message: 'You are not authenticated for this user',
        });
    }

    return next();
};
