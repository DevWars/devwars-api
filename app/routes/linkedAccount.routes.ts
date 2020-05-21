import * as express from 'express';

import * as LinkedAccountController from '../controllers/linkedAccount.controller';
import { mustBeAuthenticated, mustBeMinimumRole } from '../middleware/authentication.middleware';
import { wrapAsync } from './handlers';
import { UserRole } from '../models/user.model';

import { bodyValidation } from './validators';
import { updateTwitchCoinsSchema } from './validators/linkedAccount.validator';

const LinkedAccountRoute: express.Router = express.Router();

/******************************
 *  CONNECTIONS
 ******************************/

LinkedAccountRoute.get('/:provider', mustBeAuthenticated, wrapAsync(LinkedAccountController.connect));
LinkedAccountRoute.delete('/:provider', mustBeAuthenticated, wrapAsync(LinkedAccountController.disconnect));

/******************************
 *  COINS
 ******************************/

LinkedAccountRoute.get(
    '/:provider/:id/coins',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR, true)],
    wrapAsync(LinkedAccountController.getCoinsForUserByProvider)
);

LinkedAccountRoute.put(
    '/:provider/:id/coins',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.ADMIN, true), bodyValidation(updateTwitchCoinsSchema)],
    wrapAsync(LinkedAccountController.updateCoinsForUserByProvider)
);

export { LinkedAccountRoute };
