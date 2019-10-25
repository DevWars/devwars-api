import * as express from 'express';

import * as LinkedAccountController from '../controllers/user/LinkedAccount.controller';
import { mustBeAuthenticated } from '../middleware/Auth.middleware';
import { isTwitchBot } from '../middleware/isTwitchBot.middleware';
import { asyncErrorHandler } from './handlers';

export const LinkedAccountRoute: express.Router = express
    .Router()
    .get('/', mustBeAuthenticated, asyncErrorHandler(LinkedAccountController.all))
    .get('/:provider', mustBeAuthenticated, asyncErrorHandler(LinkedAccountController.connect))
    .delete('/:provider', mustBeAuthenticated, asyncErrorHandler(LinkedAccountController.disconnect))
    .put('/twitch/coins', isTwitchBot, asyncErrorHandler(LinkedAccountController.updateTwitchCoins));
