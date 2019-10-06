import * as express from 'express';
// TEMP: To support cookie authentication for Old Editor
import { AuthController } from '../controllers/auth/Auth.controller';
import { mustBeAuthenticated } from '../middlewares/Auth.middleware';
import { asyncErrorHandler } from './handlers';

export const TempRoute: express.Router = express
    .Router()
    .get('/', mustBeAuthenticated, asyncErrorHandler(AuthController.currentUser));
