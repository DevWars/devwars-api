import * as Joi from '@hapi/joi';

import * as constants from '../../constants';

export const updateTwitchCoinsSchema = Joi.object().keys({
    // twitchUser is required
    // It must contain at lest the username or the id of the twitch user.
    twitchUser: Joi.object()
        .keys({
            username: Joi.string()
                .min(constants.TWITCH_USERNAME_MIN_LENGTH)
                .max(constants.TWITCH_USERNAME_MAX_LENGTH),

            id: Joi.alternatives(Joi.string().min(0), Joi.number()),
        })
        .or('username', 'id')
        .required(),

    // amount is required
    // the amount of twitch coins being updated by (e.g + -5, + 5)
    amount: Joi.number()
        .min(constants.TWITCH_COINS_MIN_UPDATE)
        .max(constants.TWITCH_COINS_MAX_UPDATE)
        .required(),

    // api key required but authorized before this stage.
    apiKey: Joi.string(),
});
