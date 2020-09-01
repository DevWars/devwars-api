import * as Joi from '@hapi/joi';

import * as constants from '../../constants';
import { Sex } from '../../models/userProfile.model';
import { UserRole } from '../../models/user.model';

export const statsSchema = Joi.object().keys({
    coins: Joi.number().min(constants.STATS_COINS_MIN_AMOUNT).max(constants.STATS_COINS_MAX_AMOUNT).required(),
    xp: Joi.number().min(constants.STATS_XP_MIN_AMOUNT).max(constants.STATS_XP_MAX_AMOUNT).required(),
    level: Joi.number().min(constants.STATS_LEVEL_MIN_AMOUNT).max(constants.STATS_LEVEL_MAX_AMOUNT).required(),
});

export const profileSchema = Joi.object().keys({
    firstName: Joi.string().allow('', null).optional(),
    lastName: Joi.string().allow('', null).optional(),
    dob: Joi.date().allow(null).optional(),
    sex: Joi.string().valid(Sex.MALE, Sex.FEMALE, Sex.OTHER).optional(),
    about: Joi.string().allow('', null).optional(),
    forHire: Joi.boolean().optional(),
    company: Joi.string().allow('', null).optional(),
    websiteUrl: Joi.string().allow('', null).optional(),
    addressOne: Joi.string().allow('', null).optional(),
    addressTwo: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    zip: Joi.string().allow('', null).optional(),
    country: Joi.string().allow('', null).optional(),
    skills: Joi.object().optional(),
});

export const updateUserSchema = Joi.object().keys({
    username: Joi.string()
        .min(constants.USERNAME_MIN_LENGTH)
        .max(constants.USERNAME_MAX_LENGTH)
        .regex(constants.USERNAME_REGEX)
        .optional(),

    role: Joi.string()
        .valid(...Object.values(UserRole))
        .optional(),
});
