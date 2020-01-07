import * as express from 'express';

import * as LinkedAccountController from '../controllers/user/LinkedAccount.controller';
import { mustBeAuthenticated, mustBeRole } from '../middleware/Auth.middleware';
import { asyncErrorHandler } from './handlers';
import { UserRole } from '../models/User';

import { bodyValidation } from './validators';
import { updateTwitchCoinsSchema } from './validators/linkedAccount.validator';

const LinkedAccountRoute: express.Router = express.Router();

LinkedAccountRoute.get(
    '/',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR)],
    asyncErrorHandler(LinkedAccountController.all)
);

LinkedAccountRoute.get('/:provider', mustBeAuthenticated, asyncErrorHandler(LinkedAccountController.connect));
LinkedAccountRoute.delete('/:provider', mustBeAuthenticated, asyncErrorHandler(LinkedAccountController.disconnect));

LinkedAccountRoute.put(
    '/twitch/coins',
    mustBeRole(UserRole.ADMIN, true),
    [bodyValidation(updateTwitchCoinsSchema)],
    asyncErrorHandler(LinkedAccountController.updateTwitchCoins)
);

export { LinkedAccountRoute };
