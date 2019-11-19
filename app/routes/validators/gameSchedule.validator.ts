import * as Joi from '@hapi/joi';

import * as constants from '../../constants';

export const createGameScheduleSchema = Joi.object().keys({
    // StartTime is required
    // The start time of the game schedule.
    startTime: Joi.date().required(),

    // Mode is required
    // The mode the game is in.
    mode: Joi.string()
        .valid(...Object.values(['Classic', 'Zen Garden', 'Blitz']))
        .required(),

    // Title is not required
    // The title of the game schedule
    title: Joi.string()
        .min(constants.GAME_SCHEDULE_TITLE_MIN_LENGTH)
        .max(constants.GAME_SCHEDULE_TITLE_MAX_LENGTH),

    // Objectives is not required (since they can be added later)
    // The objectives of the game schedule

    // Objects is a list of keys that are incrementing and not array list. This makes it impossible
    // to validate with joi and will require a shuffle to an array format to better allow for
    // future validation. I have plan's to ensure that objectives are broken out into there own
    // database table to ensure normalization of data and better api flow in the future, the change
    // will probably occur then.
    objectives: Joi.object().required(),
    // .Joi.object()
    // .keys({
    //     // Description is required
    //     // The objective of the objective.
    //     description: Joi.string()
    //         .min(constants.GAME_SCHEDULE_OBJECTIVE_DESCRIPTION_MIN_LENGTH)
    //         .max(constants.GAME_SCHEDULE_OBJECTIVE_DESCRIPTION_MAX_LENGTH)
    //         .required(),

    //     // isBonus is required
    //     // If the description is a bonus task.
    //     isBonus: Joi.boolean().required(),
    // }),
});

export const updateGameScheduleSchema = Joi.object()
    .keys({
        // StartTime is not required
        // The start time of the game schedule.
        startTime: Joi.date(),

        // Mode is not required
        // The mode the game is in.
        mode: Joi.string().valid(...Object.values(['Classic', 'Zen Garden', 'Blitz'])),

        // Title is not required
        // The title of the game schedule
        title: Joi.string()
            .min(constants.GAME_SCHEDULE_TITLE_MIN_LENGTH)
            .max(constants.GAME_SCHEDULE_TITLE_MAX_LENGTH),

        // Objectives is not required (since they can be added later)
        // The objectives of the game schedule

        // Objects is a list of keys that are incrementing and not array list. This makes it impossible
        // to validate with joi and will require a shuffle to an array format to better allow for
        // future validation. I have plan's to ensure that objectives are broken out into there own
        // database table to ensure normalization of data and better api flow in the future, the change
        // will probably occur then.
        objectives: Joi.object(),
        // .Joi.object()
        // .keys({
        //     // Description is required
        //     // The objective of the objective.
        //     description: Joi.string()
        //         .min(constants.GAME_SCHEDULE_OBJECTIVE_DESCRIPTION_MIN_LENGTH)
        //         .max(constants.GAME_SCHEDULE_OBJECTIVE_DESCRIPTION_MAX_LENGTH)
        //         .required(),

        //     // isBonus is required
        //     // If the description is a bonus task.
        //     isBonus: Joi.boolean().required(),
        // }),
    })
    .unknown(true);
