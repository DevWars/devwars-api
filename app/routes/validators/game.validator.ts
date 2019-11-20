import * as Joi from '@hapi/joi';

import * as constants from '../../constants';
import { GameStatus } from '../../models/GameSchedule';

export const createGameSchema = Joi.object()
    .keys({
        season: Joi.number()
            .min(constants.GAME_SEASON_MIN)
            .required(),

        mode: Joi.string().required(),

        title: Joi.string()
            .min(constants.GAME_TITLE_MIN_LENGTH)
            .max(constants.GAME_TITLE_MAX_LENGTH)
            .required(),

        videoUrl: Joi.string()
            .allow(null)
            .optional(),

        status: Joi.string()
            .valid(...Object.values(GameStatus))
            .optional(),

        // Allowing since Storage is just JSON without a specific structure
        storage: Joi.object()
            .allow(null)
            .optional(),
    })
    .unknown(true);

export const PatchGameSchema = Joi.object()
    .keys({
        season: Joi.number()
            .min(constants.GAME_SEASON_MIN)
            .optional(),

        mode: Joi.string().required(),

        title: Joi.string()
            .min(constants.GAME_TITLE_MIN_LENGTH)
            .max(constants.GAME_TITLE_MAX_LENGTH)
            .optional(),

        videoUrl: Joi.string()
            .allow(null)
            .optional(),

        status: Joi.string().valid(...Object.values(GameStatus)),

        // Allowing since Storage is just JSON without a specific structure
        storage: Joi.object()
            .allow(null)
            .optional(),
    })
    .unknown(true);

export const addGamePlayerSchema = Joi.object()
    .keys({
        player: Joi.object()
            .keys({
                id: Joi.alternatives(Joi.string(), Joi.number()).required(),

                username: Joi.string().required(),

                language: Joi.string()
                    .valid(...Object.values(['html', 'css', 'js']))
                    .required(),
            })
            .required()
            .unknown(true),

        team: Joi.object()
            .keys({
                id: Joi.alternatives(Joi.string(), Joi.number()).required(),
            })
            .required()
            .unknown(true),
    })
    .unknown(true);

export const removeGamePlayerSchema = Joi.object()
    .keys({
        player: Joi.object()
            .keys({
                id: Joi.alternatives(Joi.string(), Joi.number()).required(),
            })
            .required()
            .unknown(true),
    })
    .unknown(true);
