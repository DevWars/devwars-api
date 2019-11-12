import * as Joi from '@hapi/joi';

import * as constants from '../../constants';
import { Sex } from '../../models/UserProfile';
import { UserRole } from '../../models/User';

export const statsSchema = Joi.object().keys({
    // coins is required
    // coins must meet the min and max requirements
    coins: Joi.number()
        .min(constants.STATS_COINS_MIN_AMOUNT)
        .max(constants.STATS_COINS_MAX_AMOUNT)
        .required(),

    // xp is required
    // xp must meet the min and max requirements
    xp: Joi.number()
        .min(constants.STATS_XP_MIN_AMOUNT)
        .max(constants.STATS_XP_MAX_AMOUNT)
        .required(),

    // level is required
    // level must meet the min and max requirements
    level: Joi.number()
        .min(constants.STATS_LEVEL_MIN_AMOUNT)
        .max(constants.STATS_LEVEL_MAX_AMOUNT)
        .required(),

    // twitchId is not required
    // Twitch id must be a valid number based on the users twitch id.
    twitchId: Joi.number(),
});

// No part of the user profile is required, but they do have there enforced types. Not meeting the
// types if specified will result in the schema validation failing.
export const profileSchema = Joi.object().keys({
    // firstName is not required
    firstName: Joi.string(),

    // lastName is not required
    lastName: Joi.string(),

    // dob is not required
    dob: Joi.date(),

    // sex is not required
    // sex must be a valid Sex
    sex: Joi.string().valid(...Object.values(Sex)),

    // about is not required
    about: Joi.string(),

    // forHire is not required
    forHire: Joi.boolean(),

    // company is not required
    company: Joi.string(),

    // websiteUrl is not required
    websiteUrl: Joi.string(),

    // addressOne is not required
    addressOne: Joi.string(),

    // addressTwo is not required
    addressTwo: Joi.string(),

    // city is not required
    city: Joi.string(),

    // state is not required
    state: Joi.string(),

    // zip is not required
    zip: Joi.string(),

    // country is not required
    country: Joi.string(),

    // skills is not required
    skills: Joi.object(),
});

export const updateUserSchema = Joi.object().keys({
    // lastSigned is not required
    lastSigned: Joi.date(),

    // email is not required
    email: Joi.string().email(),

    // username is not required
    username: Joi.string(),

    // password is not required
    // password must meet the min and max requirements
    password: Joi.string()
        .min(constants.PASSWORD_MIN_LENGTH)
        .max(constants.PASSWORD_MAX_LENGTH),

    // role is not required
    // role must be a valid UserRole
    role: Joi.string().valid(...Object.values(UserRole)),

    // username is not required
    token: Joi.string(),
});
