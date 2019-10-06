import * as express from 'express';
import { LinkedAccountController } from '../controllers/user/LinkedAccount.controller';
import { mustBeAuthenticated } from '../middlewares/Auth.middleware';
import { isTwitchBot } from '../middlewares/isTwitchBot.middleware';
import { asyncErrorHandler } from './handlers';

export const LinkedAccountRoute: express.Router = express
    .Router()
    .get('/', mustBeAuthenticated, asyncErrorHandler(LinkedAccountController.all))
    .get('/:provider', mustBeAuthenticated, asyncErrorHandler(LinkedAccountController.connect))
    .delete('/:provider', mustBeAuthenticated, asyncErrorHandler(LinkedAccountController.disconnect))
    .put('/twitch/coins', isTwitchBot, asyncErrorHandler(LinkedAccountController.updateTwitchCoins));
