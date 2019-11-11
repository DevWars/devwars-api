import { NextFunction, Request, Response } from 'express';
import * as Joi from '@hapi/joi';
import { map } from 'lodash';

export const bodyValidation = (schema: Joi.ObjectSchema) => async (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    try {
        await schema.validateAsync(request.body);
        return next();
    } catch (error) {
        return response.status(400).json({
            error: `${map(error.details, ({ message }) => message.replace(/['"]/g, '')).join(
                ' and '
            )}, please check your content and try again`,
        });
    }
};
