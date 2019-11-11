import * as express from 'express';

import * as AuthController from '../controllers/authentication/Authentication.controller';
import { mustBeAuthenticated, mustBeRoleOrOwner } from '../middleware/Auth.middleware';

import { asyncErrorHandler } from './handlers';
import { UserRole } from '../models/User';
import { registrationSchema } from './validators/register.validator';
import { bodyValidation } from './validators';

export const AuthRoute: express.Router = express
    .Router()
    .get('/user', [mustBeAuthenticated], asyncErrorHandler(AuthController.currentUser))
    .post('/login', asyncErrorHandler(AuthController.login))
    .post('/logout', [mustBeAuthenticated], asyncErrorHandler(AuthController.logout))
    .post('/register', [bodyValidation(registrationSchema)], asyncErrorHandler(AuthController.register))
    .get('/verify', asyncErrorHandler(AuthController.verify))
    .post('/reverify', [mustBeAuthenticated], asyncErrorHandler(AuthController.reverify))
    .post('/forgot/password', asyncErrorHandler(AuthController.initiatePasswordReset))
    .post('/reset/password', asyncErrorHandler(AuthController.resetPassword))
    .post(
        '/reset/email',
        [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR)],
        asyncErrorHandler(AuthController.initiateEmailReset)
    );
