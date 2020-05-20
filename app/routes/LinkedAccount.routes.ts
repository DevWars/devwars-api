import * as express from 'express';

import * as LinkedAccountController from '../controllers/linkedAccount.controller';
import { mustBeAuthenticated, mustBeMinimumRole } from '../middleware/authentication.middleware';
import { wrapAsync } from './handlers';
import { UserRole } from '../models/user.model';

import { bodyValidation } from './validators';
import { updateTwitchCoinsSchema } from './validators/linkedAccount.validator';

const LinkedAccountRoute: express.Router = express.Router();

LinkedAccountRoute.get(
    '/',
    mustBeAuthenticated,
    mustBeMinimumRole(UserRole.MODERATOR),
    wrapAsync(LinkedAccountController.all)
);

LinkedAccountRoute.get('/:provider', mustBeAuthenticated, wrapAsync(LinkedAccountController.connect));
LinkedAccountRoute.delete('/:provider', mustBeAuthenticated, wrapAsync(LinkedAccountController.disconnect));

LinkedAccountRoute.put(
    '/twitch/coins',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.ADMIN, true), bodyValidation(updateTwitchCoinsSchema)],
    wrapAsync(LinkedAccountController.updateTwitchCoins)
);

export { LinkedAccountRoute };
