import { NextFunction, Request, Response } from 'express';

export const isTwitchBot = async (request: Request, response: Response, next: NextFunction) => {
    const apiKey = request.body.apiKey;

    if (apiKey !== process.env.API_KEY) {
        return response.sendStatus(403);
    }

    return next();
};
