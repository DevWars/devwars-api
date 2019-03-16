import {NextFunction, Request, Response} from 'express';

import {CompetitorRepository, UserRepository} from '../repository';

export const mustBeCompetitor = async (request: Request, response: Response, next: NextFunction) => {
    const token = request.cookies.auth;
    const user = await UserRepository.userForToken(token);
    const competitor = await CompetitorRepository.forUser(user);

    if (user && competitor) {
        return next();
    }

    response.status(400).json({
        error: 'Not a competitor',
    });
};
