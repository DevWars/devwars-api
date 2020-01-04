import { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';
import ApiError from '../utils/apiError';

/**
 *  Handles catches in which the next response of a given controller is a error
 *  but was not caught by anything. Ensuring that regardless of the result, that
 *  the user still gets a response back from the server.
 */
export function handleError(error: any, request: Request, response: Response, next: NextFunction) {
    logger.error(`error on request: ${request.protocol}://${request.get('host')}${request.originalUrl}, ${error}`);

    return response.status(error.status || 500).json({ error: error.message });
}

/**
 * Handles cases in which the route does not exist, e.g /authentication/missing
 */
export function handleMissing(request: Request, response: Response, next: NextFunction) {
    return response.redirect(process.env.FRONT_URL);
}
