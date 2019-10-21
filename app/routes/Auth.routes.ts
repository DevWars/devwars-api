import * as express from 'express';

import * as AuthController from '../controllers/authentication/authentication.controller';
import { mustBeAuthenticated } from '../middleware/Auth.middleware';

import { mustOwnUser } from '../middleware/OwnsUser';
import { asyncErrorHandler } from './handlers';

export const AuthRoute: express.Router = express
    .Router()
    .get('/user', [mustBeAuthenticated], asyncErrorHandler(AuthController.currentUser))
    .post('/login', asyncErrorHandler(AuthController.login))
    .post('/logout', [mustBeAuthenticated], asyncErrorHandler(AuthController.logout))
    .post('/register', asyncErrorHandler(AuthController.register))
    .get('/verify', asyncErrorHandler(AuthController.verify))
    .post('/reverify', [mustBeAuthenticated], asyncErrorHandler(AuthController.reVerify))
    .post('/forgot/password', asyncErrorHandler(AuthController.initiatePasswordReset))
    .post('/reset/password', asyncErrorHandler(AuthController.resetPassword))
    .post('/reset/email', [mustBeAuthenticated, mustOwnUser], asyncErrorHandler(AuthController.initiateEmailReset));
