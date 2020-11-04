import * as express from 'express';
import { wrapAsync } from './handlers';

import * as BadgeController from '../controllers/badge.controller';
import { mustBeAuthenticated } from '../middleware/authentication.middleware';

export const BadgeRoute: express.Router = express.Router();

BadgeRoute.get(
    '/',
    [mustBeAuthenticated],
    wrapAsync(BadgeController.getAllCurrentBadges),
);
