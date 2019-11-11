import { NextFunction, Request, Response } from 'express';
import * as Joi from '@hapi/joi';
import { map } from 'lodash';

async function validator(
    content: any,
    schema: Joi.ObjectSchema,
    code: number = 400,
    request: Request,
    response: Response,
    next: NextFunction
) {
    try {
        await schema.validateAsync(content);
        return next();
    } catch (error) {
        return response.status(code).json({
            error: `${map(error.details, ({ message }) => message.replace(/['"]/g, '')).join(
                ' and '
            )}, please check your content and try again`,
        });
    }
}

/**
 * Applies and performs a joi validation on the request body based on the passed schema. If the
 * validation passes, the next function will be called, otherwise a formatted error message will
 * be returned with the provided status code (defaulting to 400 if not specified).
 * @param schema The joi schema to be validated against.
 * @param code The http code response on validated validation.
 */
export const bodyValidation = (schema: Joi.ObjectSchema, code?: number) => async (
    request: Request,
    response: Response,
    next: NextFunction
) => validator(request.body, schema, code, request, response, next);

/**
 * Applies and performs a joi validation on the request query based on the passed schema. If the
 * validation passes, the next function will be called, otherwise a formatted error message will
 * be returned with the provided status code (defaulting to 400 if not specified).
 * @param schema The joi schema to be validated against.
 * @param code The http code response on validated validation.
 */
export const queryValidation = (schema: Joi.ObjectSchema, code?: number) => async (
    request: Request,
    response: Response,
    next: NextFunction
) => validator(request.query, schema, code, request, response, next);

/**
 * Applies and performs a joi validation on the request query based on the passed schema. If the
 * validation passes, the next function will be called, otherwise a formatted error message will
 * be returned with the provided status code (defaulting to 400 if not specified).
 * @param schema The joi schema to be validated against.
 * @param code The http code response on validated validation.
 */
export const paramsValidation = (schema: Joi.ObjectSchema, code?: number) => async (
    request: Request,
    response: Response,
    next: NextFunction
) => validator(request.params, schema, code, request, response, next);
