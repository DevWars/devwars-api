import * as Joi from '@hapi/joi';

export const registrationSchema = Joi.object().keys({
    // email is required
    // email must be a valid email string
    email: Joi.string()
        .email()
        .required(),

    // username is required
    // username must a min length of 5 and upper limit of 28.
    username: Joi.string()
        .min(5)
        .max(28)
        .required(),

    // password is required
    // password must be a min length of 5 and upper limit of 128.
    password: Joi.string()
        .min(8)
        .max(128)
        .required(),
});
