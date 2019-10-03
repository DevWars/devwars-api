import { NextFunction, Response } from 'express';

import { IRequest } from '../request/IRequest';
import { UserRole } from '../models/User';

/**
 *  mustOwnUser ensures that the current authenticated is the same entity as the one the following
 *  request is being performed on. e.g updating there own profile but not owners.
 */
export const mustOwnUser = async (request: IRequest, response: Response, next: NextFunction) => {
    const requestedUserId = Number(request.params.id);

    // Ensure that the requesting user is the entity they are also trying to perform the following
    // request on. For example: you can only update your own profile and not others (unless your a admin).
    if (request.user.id !== requestedUserId && request.user.role !== UserRole.ADMIN) {
        return response.sendStatus(401).json({
            message: 'Unauthorized, you can only perform this action on yourself.',
        });
    }

    return next();
};
