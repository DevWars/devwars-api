import { NextFunction, Request, Response } from 'express';
import logger from '../../utils/logger';
import ApiError from '../../utils/apiError';
import { isNil, isNumber } from 'lodash';

/**
 * A wrapper around the final request of a given route, if the route fails due to a unexpected case
 * or issue, then this will catch it. Responding to the user with a internal error message or a
 * stack trace + error in development/testing.
 */
export const asyncErrorHandler = (func: any) => async (request: Request, response: Response, next: NextFunction) => {
    try {
        await func(request, response, next);
    } catch (error) {
        const apiError = error as ApiError;

        // If specified or ont a api error, log the error.
        if ((!isNil(apiError.code) && apiError.log) || isNil(apiError.code)) {
            const { protocol, originalUrl } = request;

            logger.error(`error on request: ${protocol}://${request.get('host')}${originalUrl}, ${error}`);
        }

        // If we have thrown a instance of a apiError and it was not a 500, then process the
        // expected error message with the expected code + error message.
        if (!isNil(apiError.code) && isNumber(apiError.code)) {
            return response.status(apiError.code).json({ error: apiError.message });
        }

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
