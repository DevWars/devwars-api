import * as Joi from '@hapi/joi';

import * as constants from '../../constants';

export const registrationSchema = Joi.object().keys({
    // email is required
    // email must be a valid email string
    email: Joi.string()
        .email()
        .required(),

    // username is required
    // username must a min length of 5 and upper limit of 28.
    username: Joi.string()
        .min(constants.USERNAME_MIN_LENGTH)
        .max(constants.USERNAME_MAX_LENGTH)
        .required(),

    // password is required
    // password must be a min length of 5 and upper limit of 128.
    password: Joi.string()
        .min(constants.PASSWORD_MIN_LENGTH)
        .max(constants.PASSWORD_MAX_LENGTH)
        .required(),
});

export const loginSchema = Joi.object().keys({
    // identifier is required
    // The identifier must be a valid email or username.
    identifier: Joi.alternatives(
        Joi.string()
            .email()
            .required(),
        Joi.string()
            .min(constants.USERNAME_MIN_LENGTH)
            .max(constants.USERNAME_MAX_LENGTH)
            .required()
    ).required(),

    // password is required
    // password must be a min length of 5 and upper limit of 128.
    password: Joi.string()
        .min(constants.PASSWORD_MIN_LENGTH)
        .max(constants.PASSWORD_MAX_LENGTH)
        .required(),
});

export const forgotPasswordSchema = Joi.object().keys({
    // username or email is required
    // The username or email must be a valid email or username.
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
    // token is required
    // token must be a non-empty valid string
    token: Joi.string().required(),

    // password is required
    // password must be a min length of 5 and upper limit of 128.
    password: Joi.string()
        .min(constants.PASSWORD_MIN_LENGTH)
        .max(constants.PASSWORD_MAX_LENGTH)
        .required(),
});
