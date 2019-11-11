import * as express from 'express';

import {
    loginSchema,
    registrationSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from './validators/authentication.validator';
import * as AuthController from '../controllers/authentication/Authentication.controller';
import { mustBeAuthenticated, mustBeRoleOrOwner } from '../middleware/Auth.middleware';

import { asyncErrorHandler } from './handlers';
import { UserRole } from '../models/User';
import { bodyValidation, queryValidation } from './validators';

const AuthRoute: express.Router = express.Router();

AuthRoute.get('/user', [mustBeAuthenticated], asyncErrorHandler(AuthController.currentUser));
AuthRoute.post('/login', [bodyValidation(loginSchema)], asyncErrorHandler(AuthController.login));
AuthRoute.post('/logout', [mustBeAuthenticated], asyncErrorHandler(AuthController.logout));
AuthRoute.post('/register', [bodyValidation(registrationSchema)], asyncErrorHandler(AuthController.register));
AuthRoute.get('/verify', asyncErrorHandler(AuthController.verify));
AuthRoute.post('/reverify', [mustBeAuthenticated], asyncErrorHandler(AuthController.reverify));

AuthRoute.post(
    '/forgot/password',
    [bodyValidation(forgotPasswordSchema)],
    asyncErrorHandler(AuthController.initiatePasswordReset)
);

AuthRoute.post(
    '/reset/password',
    [queryValidation(resetPasswordSchema)],
    asyncErrorHandler(AuthController.resetPassword)
);

AuthRoute.post(
    '/reset/email',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR)],
    asyncErrorHandler(AuthController.initiateEmailReset)
);

export { AuthRoute };
