import * as Joi from '@hapi/joi';

import * as constants from '../../constants';

export const createGameScheduleSchema = Joi.object()
    .keys({
        startTime: Joi.date().required(),

        mode: Joi.string()
            .valid(...Object.values(['Classic', 'Zen Garden', 'Blitz']))
            .required(),

        title: Joi.string()
            .min(constants.GAME_SCHEDULE_TITLE_MIN_LENGTH)
            .max(constants.GAME_SCHEDULE_TITLE_MAX_LENGTH)
            .optional(),

        // Objects is a list of keys that are incrementing and not array list. This makes it impossible
        // to validate with joi and will require a shuffle to an array format to better allow for
        // future validation. I have plan's to ensure that objectives are broken out into there own
        // database table to ensure normalization of data and better api flow in the future, the change
        // will probably occur then.
        objectives: Joi.object().optional().allow(null),

        // The templates that are going to be used on the live editors. Any set
        // would be used on the setup process of the editor.
        templates: Joi.object().optional().allow(null),
    })
    .unknown(true);

export const updateGameScheduleSchema = Joi.object()
    .keys({
        startTime: Joi.date().optional(),

        mode: Joi.string()
            .valid(...Object.values(['Classic', 'Zen Garden', 'Blitz']))
            .optional(),

        title: Joi.string()
            .min(constants.GAME_SCHEDULE_TITLE_MIN_LENGTH)
            .max(constants.GAME_SCHEDULE_TITLE_MAX_LENGTH)
            .optional(),

        // Objects is a list of keys that are incrementing and not array list. This makes it impossible
        // to validate with joi and will require a shuffle to an array format to better allow for
        // future validation. I have plan's to ensure that objectives are broken out into there own
        // database table to ensure normalization of data and better api flow in the future, the change
        // will probably occur then.
        objectives: Joi.object().optional(),
        // .Joi.object()
        // .keys({
        //     description: Joi.string()
        //         .min(constants.GAME_SCHEDULE_OBJECTIVE_DESCRIPTION_MIN_LENGTH)
        //         .max(constants.GAME_SCHEDULE_OBJECTIVE_DESCRIPTION_MAX_LENGTH)
        //         .required(),
        //
        //     isBonus: Joi.boolean().required(),
        // }),
    })
    .unknown(true);
