import * as Joi from '@hapi/joi';
import {
    CONTACT_US_NAME_MIN,
    CONTACT_US_NAME_MAX,
    CONTACT_US_MESSAGE_MIN,
    CONTACT_US_MESSAGE_MAX,
} from '../../constants';

export const contactUsSchema = Joi.object().keys({
    name: Joi.string()
        .min(CONTACT_US_NAME_MIN)
        .max(CONTACT_US_NAME_MAX)
        .required(),

    email: Joi.string()
        .email()
        .required(),

    message: Joi.string()
        .min(CONTACT_US_MESSAGE_MIN)
        .max(CONTACT_US_MESSAGE_MAX)
        .required(),
});
