import * as express from 'express';
// TEMP: To support cookie authentication for Old Editor
import * as AuthController from '../controllers/authentication/Authentication.controller';
import { mustBeAuthenticated } from '../middleware/Auth.middleware';
import { wrapAsync } from './handlers';

export const TempRoute: express.Router = express
    .Router()
    .get('/', mustBeAuthenticated, wrapAsync(AuthController.currentUser));
