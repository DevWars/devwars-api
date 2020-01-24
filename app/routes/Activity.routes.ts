import * as express from 'express';

import { mustBeAuthenticated } from '../middleware/Auth.middleware';
import * as ActivityController from '../controllers/user/Activity.controller';
import { wrapAsync } from './handlers';

export const ActivityRoute: express.Router = express
    .Router()
    .get('/mine', mustBeAuthenticated, wrapAsync(ActivityController.mine));
