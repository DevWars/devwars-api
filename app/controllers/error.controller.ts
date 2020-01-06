import { NextFunction, Request, Response } from 'express';
import { isNil, isNumber } from 'lodash';

import logger from '../utils/logger';
import ApiError from '../utils/apiError';

/**
 *  Handles catches in which the next response of a given controller is a error
 *  but was not caught by anything. Ensuring that regardless of the result, that
 *  the user still gets a response back from the server.
 */
export function handleError(error: any, request: Request, response: Response, next: NextFunction) {
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
        return response.sendStatus(500).json({ error: 'Internal server error, something went wrong.' });
    }

    return response.status(500).json({ error: error.message, stack: error.stack });
}

/**
 * Handles cases in which the route does not exist, e.g /authentication/missing
 */
export function handleMissing(request: Request, response: Response, next: NextFunction) {
    return response.redirect(process.env.FRONT_URL);
}
