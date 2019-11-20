import * as Joi from '@hapi/joi';

import * as constants from '../../constants';
import { Sex } from '../../models/UserProfile';
import { UserRole } from '../../models/User';

export const statsSchema = Joi.object()
    .keys({
        coins: Joi.number()
            .min(constants.STATS_COINS_MIN_AMOUNT)
            .max(constants.STATS_COINS_MAX_AMOUNT)
            .required(),

        xp: Joi.number()
            .min(constants.STATS_XP_MIN_AMOUNT)
            .max(constants.STATS_XP_MAX_AMOUNT)
            .required(),

        level: Joi.number()
            .min(constants.STATS_LEVEL_MIN_AMOUNT)
            .max(constants.STATS_LEVEL_MAX_AMOUNT)
            .required(),

        twitchId: Joi.number().optional(),
    })
    .unknown(true);

export const profileSchema = Joi.object()
    .keys({
        firstName: Joi.string().optional(),

        lastName: Joi.string().optional(),

        dob: Joi.date().optional(),

        sex: Joi.string()
            .valid(...Object.values(Sex))
            .optional(),

        about: Joi.string().optional(),

        forHire: Joi.boolean().optional(),

        company: Joi.string().optional(),

        websiteUrl: Joi.string().optional(),

        addressOne: Joi.string().optional(),

        addressTwo: Joi.string().optional(),

        city: Joi.string().optional(),

        state: Joi.string().optional(),

        zip: Joi.string().optional(),

        country: Joi.string().optional(),

        skills: Joi.object().optional(),
    })
    .unknown(true);

export const updateUserSchema = Joi.object()
    .keys({
        lastSigned: Joi.date().optional(),

        email: Joi.string()
            .email()
            .optional(),

        username: Joi.string()
            .min(constants.USERNAME_MIN_LENGTH)
            .max(constants.USERNAME_MAX_LENGTH)
            .regex(constants.USERNAME_REGEX)
            .optional(),

        password: Joi.string()
            .min(constants.PASSWORD_MIN_LENGTH)
            .max(constants.PASSWORD_MAX_LENGTH)
            .optional(),

        role: Joi.string()
            .valid(...Object.values(UserRole))
            .optional(),

        token: Joi.string().optional(),
    })
    .unknown(true);
