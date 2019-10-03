import * as express from 'express';

import { AuthController } from '../controllers/auth/Auth.controller';
import { mustOwnUser } from '../middlewares/OwnsUser';
import { asyncErrorHandler } from './handlers';

import { mustBeAuthenticated } from '../middlewares/Auth.middleware';

export const AuthRoute: express.Router = express
    .Router()
    .get('/user', mustBeAuthenticated, asyncErrorHandler(AuthController.currentUser))
    .post('/login', asyncErrorHandler(AuthController.login))
    .post('/logout', asyncErrorHandler(AuthController.logout))
    .post('/register', asyncErrorHandler(AuthController.register))
    .get('/verify', asyncErrorHandler(AuthController.verify))
    .post('/reverify', mustBeAuthenticated, asyncErrorHandler(AuthController.reVerify))
    .post(
        '/forgot/password',
        [mustBeAuthenticated, mustOwnUser],
        asyncErrorHandler(AuthController.initiatePasswordReset)
    )
    .post('/reset/password', [mustBeAuthenticated, mustOwnUser], asyncErrorHandler(AuthController.resetPassword))
    .post('/reset/email', [mustBeAuthenticated, mustOwnUser], asyncErrorHandler(AuthController.initiateEmailReset));
