import * as express from 'express';
import { wrapAsync } from './handlers';

import * as SearchController from '../controllers/search.controller';
import { mustBeMinimumRole, mustBeAuthenticated } from '../middleware/authentication.middleware';
import { UserRole } from '../models/user.model';

export const SearchRoute: express.Router = express.Router();

SearchRoute.get(
    '/users',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR, true)],
    wrapAsync(SearchController.searchForUsers)
);

SearchRoute.get(
    '/users/connections',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR, true)],
    wrapAsync(SearchController.searchForUsersByConnections)
);

SearchRoute.get(
    '/games',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR)],
    wrapAsync(SearchController.searchForGames)
);
