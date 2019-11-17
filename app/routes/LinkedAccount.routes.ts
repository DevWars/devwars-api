import * as express from 'express';

import * as LinkedAccountController from '../controllers/user/LinkedAccount.controller';
import { mustBeAuthenticated, mustBeRole } from '../middleware/Auth.middleware';
import { asyncErrorHandler } from './handlers';
import { UserRole } from '../models/User';

export const LinkedAccountRoute: express.Router = express
    .Router()
    .get('/', mustBeAuthenticated, asyncErrorHandler(LinkedAccountController.all))
    .get('/:provider', mustBeAuthenticated, asyncErrorHandler(LinkedAccountController.connect))
    .delete('/:provider', mustBeAuthenticated, asyncErrorHandler(LinkedAccountController.disconnect))
    .put(
        '/twitch/coins',
        mustBeRole(UserRole.ADMIN, true),
        asyncErrorHandler(LinkedAccountController.updateTwitchCoins)
    );
