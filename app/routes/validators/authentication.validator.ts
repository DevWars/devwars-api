import * as Joi from '@hapi/joi';

import * as constants from '../../constants';

export const registrationSchema = Joi.object().keys({
    email: Joi.string()
        .email()
        .required(),

    username: Joi.string()
        .min(constants.USERNAME_MIN_LENGTH)
        .max(constants.USERNAME_MAX_LENGTH)
        .required(),

    password: Joi.string()
        .min(constants.PASSWORD_MIN_LENGTH)
        .max(constants.PASSWORD_MAX_LENGTH)
        .required(),
});

export const loginSchema = Joi.object().keys({
    identifier: Joi.alternatives(
        Joi.string()
            .email()
            .required(),
        Joi.string()
            .min(constants.USERNAME_MIN_LENGTH)
            .max(constants.USERNAME_MAX_LENGTH)
            .required()
    ).required(),

    password: Joi.string()
        .min(constants.PASSWORD_MIN_LENGTH)
        .max(constants.PASSWORD_MAX_LENGTH)
        .required(),
});

export const forgotPasswordSchema = Joi.object().keys({
    username_or_email: Joi.alternatives(
        Joi.string()
            .email()
            .required(),
        Joi.string()
            .min(constants.USERNAME_MIN_LENGTH)
            .max(constants.USERNAME_MAX_LENGTH)
            .required()
    ).required(),
});

/**
 * The reset password schema for when a password is being updated. It must contain a valid
 * token (which will be validated by the endpoint) and a valid password that meets the
 * system requirements
 */
export const resetPasswordSchema = Joi.object().keys({
    token: Joi.string().required(),

    password: Joi.string()
        .min(constants.PASSWORD_MIN_LENGTH)
        .max(constants.PASSWORD_MAX_LENGTH)
        .required(),
});

/**
 * The reset password schema for when a password is being updated. It must contain a valid
 * token (which will be validated by the endpoint) and a valid password that meets the
 * system requirements
 */
export const resetEmailSchema = Joi.object().keys({
    email: Joi.string()
        .email()
        .required(),

    password: Joi.string()
        .min(constants.PASSWORD_MIN_LENGTH)
        .max(constants.PASSWORD_MAX_LENGTH)
        .required(),
});
