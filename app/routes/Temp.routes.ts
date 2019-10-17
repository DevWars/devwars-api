import * as express from 'express';
// TEMP: To support cookie authentication for Old Editor
import * as AuthController from '../controllers/authentication/authentication.controller';
import { mustBeAuthenticated } from '../middleware/Auth.middleware';
import { asyncErrorHandler } from './handlers';

export const TempRoute: express.Router = express
    .Router()
    .get('/', mustBeAuthenticated, asyncErrorHandler(AuthController.currentUser));
