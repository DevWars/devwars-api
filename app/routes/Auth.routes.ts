import * as express from 'express';
import { AuthController } from '../controllers/auth/Auth.controller';
import { mustOwnUser } from '../middlewares/OwnsUser';
import { asyncErrorHandler } from './handlers';

export const AuthRoute: express.Router = express
    .Router()
    .get('/user', asyncErrorHandler(AuthController.currentUser))
    .post('/login', asyncErrorHandler(AuthController.login))
    .post('/logout', asyncErrorHandler(AuthController.logout))
    .post('/register', asyncErrorHandler(AuthController.register))
    .get('/verify', asyncErrorHandler(AuthController.verify))
    .post('/reverify', asyncErrorHandler(AuthController.reVerify))
    .post('/forgot/password', mustOwnUser, asyncErrorHandler(AuthController.initiatePasswordReset))
    .post('/reset/password', mustOwnUser, asyncErrorHandler(AuthController.resetPassword))
    .post('/reset/email', mustOwnUser, asyncErrorHandler(AuthController.initiateEmailReset));
