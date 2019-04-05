import * as express from 'express';

import * as ActivityController from '../controllers/user/Activity.controller';
import { asyncErrorHandler } from './handlers'
import { mustBeAuthenticated } from '../middlewares/Auth.middleware';

export const ActivityRoute: express.Router = express
    .Router()
    .get('/mine', mustBeAuthenticated, asyncErrorHandler(ActivityController.mine));
