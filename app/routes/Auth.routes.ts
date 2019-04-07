import * as express from 'express';
import { AuthController } from '../controllers/auth/Auth.controller';
import { ResetController } from '../controllers/user/Reset.controller';
import { mustOwnUser } from '../middlewares/OwnsUser';
import { asyncErrorHandler } from './handlers';

export const AuthRoute: express.Router = express
    .Router()
    .get('/user', asyncErrorHandler(AuthController.currentUser))
    .post('/login', asyncErrorHandler(AuthController.login))
    .post('/logout', asyncErrorHandler(AuthController.logout))
    .post('/register', asyncErrorHandler(AuthController.register))
    .get('/verify', asyncErrorHandler(AuthController.verify))
    .post('/re-verify', asyncErrorHandler(AuthController.reVerify))
    .post('/reset', asyncErrorHandler(AuthController.initiatePasswordReset))
    .get('/reset', asyncErrorHandler(AuthController.resetPassword))
    .post('/reset/email', mustOwnUser, asyncErrorHandler(ResetController.email))
    .put('/reset/password', mustOwnUser, asyncErrorHandler(ResetController.password));
