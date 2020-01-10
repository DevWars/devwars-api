import * as express from 'express';

import * as LinkedAccountController from '../controllers/user/LinkedAccount.controller';
import { mustBeAuthenticated, mustBeRole } from '../middleware/Auth.middleware';
import { wrapAsync } from './handlers';
import { UserRole } from '../models/User';

import { bodyValidation } from './validators';
import { updateTwitchCoinsSchema } from './validators/linkedAccount.validator';

const LinkedAccountRoute: express.Router = express.Router();

LinkedAccountRoute.get('/', mustBeAuthenticated, wrapAsync(LinkedAccountController.all));
LinkedAccountRoute.get('/:provider', mustBeAuthenticated, wrapAsync(LinkedAccountController.connect));
LinkedAccountRoute.delete('/:provider', mustBeAuthenticated, wrapAsync(LinkedAccountController.disconnect));

LinkedAccountRoute.put(
    '/twitch/coins',
    [mustBeRole(UserRole.ADMIN, true), bodyValidation(updateTwitchCoinsSchema)],
    wrapAsync(LinkedAccountController.updateTwitchCoins)
);

export { LinkedAccountRoute };
