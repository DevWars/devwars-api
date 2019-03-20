import * as express from 'express';

import * as ActivityController from '../controllers/user/Activity.controller';
import { mustBeAuthenticated } from '../middlewares/Auth.middleware';

export const ActivityRoute: express.Router = express
    .Router()
    .get('/mine', mustBeAuthenticated, ActivityController.mine);
