import * as Joi from '@hapi/joi';

import * as constants from '../../constants';
import { GameStatus } from '../../models/game.model';

export const createGameSchema = Joi.object().keys({
    startTime: Joi.date().required(),

    season: Joi.number().min(constants.GAME_SEASON_MIN).required(),

    mode: Joi.string().required(),

    title: Joi.string().min(constants.GAME_TITLE_MIN_LENGTH).max(constants.GAME_TITLE_MAX_LENGTH).required(),

    videoUrl: Joi.string().allow(null).optional(),

    status: Joi.string().valid(...Object.values(GameStatus)),

    templates: Joi.object()
        .keys({
            html: Joi.string().allow(null).optional(),
            css: Joi.string().allow(null).optional(),
            js: Joi.string().allow(null).optional(),
        })
        .optional(),
});

export const PatchGameSchema = Joi.object().keys({
    startTime: Joi.date().optional(),

    status: Joi.string().valid(...Object.values(GameStatus)),

    meta: Joi.object().optional(),

    objectives: Joi.object().optional(),

    title: Joi.string().min(constants.GAME_TITLE_MIN_LENGTH).max(constants.GAME_TITLE_MAX_LENGTH).optional(),

    season: Joi.number().min(constants.GAME_SEASON_MIN).optional(),

    mode: Joi.string().required(),

    videoUrl: Joi.string().allow(null).optional(),

    templates: Joi.object()
        .keys({
            html: Joi.string().allow(null).allow('').optional(),
            css: Joi.string().allow(null).allow('').optional(),
            js: Joi.string().allow(null).allow('').optional(),
        })
        .optional(),
});

export const addGamePlayerSchema = Joi.object().keys({
    player: Joi.object()
        .keys({
            id: Joi.alternatives(Joi.string(), Joi.number()).required(),

            language: Joi.string()
                .valid(...Object.values(['html', 'css', 'js']))
                .required(),

            team: Joi.alternatives(Joi.number()).required(),
        })
        .required(),
});

export const removeGamePlayerSchema = Joi.object().keys({
    player: Joi.object()
        .keys({
            id: Joi.alternatives(Joi.string(), Joi.number()).required(),
        })
        .required(),
});
