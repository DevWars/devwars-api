import * as express from 'express';
import { wrapAsync } from './handlers';

import * as SearchController from '../controllers/search.controller';
import { mustBeMinimumRole, mustBeAuthenticated } from '../middleware/authentication.middleware';
import { UserRole } from '../models/user.model';

export const SearchRoute: express.Router = express
    .Router()
    .get(
        '/users',
        [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR)],
        wrapAsync(SearchController.lookupUser)
    );
