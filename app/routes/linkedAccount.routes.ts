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

LinkedAccountRoute.get('/:provider', mustBeAuthenticated, wrapAsync(LinkedAccountController.connectToProvider));
LinkedAccountRoute.delete('/:provider', mustBeAuthenticated, wrapAsync(LinkedAccountController.disconnectFromProvider));

/******************************
 *  COINS
 ******************************/

LinkedAccountRoute.get(
    '/:provider/:id/coins',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR, true)],
    wrapAsync(LinkedAccountController.getCoinsForUserByProviderAndUserId)
);

LinkedAccountRoute.patch(
    '/:provider/:id/coins',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.ADMIN, true), bodyValidation(updateTwitchCoinsSchema)],
    wrapAsync(LinkedAccountController.updateCoinsForUserByProviderAndUserId)
);

export { LinkedAccountRoute };
