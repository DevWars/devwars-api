import { NextFunction, Request, Response } from 'express';
import logger from '../../utils/logger';

/**
 * A wrapper around the final request of a given route, if the route fails due to a unexpected case
 * or issue, then this will catch it. Responding to the user with a internal error message or a
 * stack trace + error in development/testing.
 */
export const asyncErrorHandler = (func: any) => async (request: Request, response: Response, next: NextFunction) => {
    try {
        await func(request, response, next);
    } catch (error) {
        logger.error(`error on request: ${request.protocol}://${request.get('host')}${request.originalUrl}, ${error}`);

        // if we are in production and a internal server error occurs, just let the user know. We
        // don't want to be exposing any additional information that would help someone trying to
        // gather internal information about the system. But during development, ignore this and
        // send back the error and the stack that caused it.
        if (process.env.NODE_ENV === 'production') {
            return response.status(500).json({ error: 'Internal server error, something went wrong.' });
        }

        return response.status(500).json({ error: error.message, stack: error.stack });
    }
};
