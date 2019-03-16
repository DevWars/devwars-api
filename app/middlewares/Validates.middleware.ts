import {NextFunction, Request, Response} from 'express';

import * as Joi from 'joi';
import {ObjectSchema} from 'joi';

export const validates = (schema: ObjectSchema) => async (request: Request, response: Response, next: NextFunction) => {
    const {error, value} = Joi.validate(request.body, schema, {stripUnknown: true, convert: true});

    if (error && error.details && error.details.length) {
        return response.status(400).json(error.details);
    }

    return next();
};
