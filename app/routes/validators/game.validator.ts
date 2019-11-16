import * as Joi from '@hapi/joi';

import * as constants from '../../constants';
import { GameStatus } from '../../models/GameSchedule';

export const createGameSchema = Joi.object().keys({
    // season is required
    // The current season that game is running on.
    season: Joi.number()
        .min(constants.GAME_SEASON_MIN)
        .required(),

    // mode is required
    // The current mode that game is in.
    mode: Joi.string().required(),

    // title is required
    // The current title of that game.
    title: Joi.string()
        .min(constants.GAME_TITLE_MIN_LENGTH)
        .max(constants.GAME_TITLE_MAX_LENGTH)
        .required(),

    // video url is not required
    // The link to the post recording.
    videoUrl: Joi.string(),

    // status is not required
    // the status of the game, default ot scheduled.
    status: Joi.string().valid(...Object.values(GameStatus)),

    // storage is not required.
    // storage is additional json information that is stored but will be replaced regardless of the
    // content sent, so just allow it.
    storage: Joi.object(),
});

export const PatchGameSchema = Joi.object().keys({
    // season is not required for patching
    // The current season that game is running on.
    season: Joi.number().min(constants.GAME_SEASON_MIN),

    // mode is not required for patching
    // The current mode that game is in.
    mode: Joi.string().required(),

    // title is not required for patching
    // The current title of that game.
    title: Joi.string()
        .min(constants.GAME_TITLE_MIN_LENGTH)
        .max(constants.GAME_TITLE_MAX_LENGTH),

    // video url is not required
    // The link to the post recording.
    videoUrl: Joi.string(),

    // status is not required
    // the status of the game, default ot scheduled.
    status: Joi.string().valid(...Object.values(GameStatus)),

    // storage is not required.
    // storage is additional json information that is stored but will be replaced regardless of the
    // content sent, so just allow it.
    storage: Joi.object(),
});

export const addGamePlayerSchema = Joi.object().keys({
    // Player is required
    // The player being added.
    player: Joi.object()
        .keys({
            // Id is required
            // The id of the user who is being added.
            id: Joi.alternatives(Joi.string(), Joi.number()).required(),

            // username is required
            // username is the devwars username of who is the player.
            username: Joi.string().required(),

            // language is required
            // language is the devwars username language (css, html, js).
            language: Joi.string().required(),
        })
        .required(),

    // Team is required
    // The team gaining the player.
    team: Joi.object()
        .keys({
            // Id is required
            // The id of the team who is getting a new player.
            id: Joi.alternatives(Joi.string(), Joi.number()).required(),
        })
        .required(),
});

export const removeGamePlayerSchema = Joi.object().keys({
    // Player is required
    // The player being added.
    player: Joi.object()
        .keys({
            // Id is required
            // The id of the user who is being added.
            id: Joi.alternatives(Joi.string(), Joi.number()).required(),
        })
        .required(),
});
