import * as Joi from '@hapi/joi';

import * as constants from '../../constants';

export const updateTwitchCoinsSchema = Joi.object().keys({
    amount: Joi.number().min(constants.TWITCH_COINS_MIN_UPDATE).max(constants.TWITCH_COINS_MAX_UPDATE).required(),
    username: Joi.string().required(),
    apiKey: Joi.string().optional(),
});
