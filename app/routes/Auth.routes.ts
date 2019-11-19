import * as express from 'express';

import * as authValidator from './validators/authentication.validator';
import * as AuthController from '../controllers/authentication/Authentication.controller';
import { mustBeAuthenticated, mustBeRoleOrOwner } from '../middleware/Auth.middleware';

import { bodyValidation, queryValidation } from './validators';
import { asyncErrorHandler } from './handlers';
import { UserRole } from '../models/User';

const AuthRoute: express.Router = express.Router();

AuthRoute.get('/user', [mustBeAuthenticated], asyncErrorHandler(AuthController.currentUser));
AuthRoute.post('/login', [bodyValidation(authValidator.loginSchema)], asyncErrorHandler(AuthController.login));
AuthRoute.post('/logout', [mustBeAuthenticated], asyncErrorHandler(AuthController.logout));

AuthRoute.post(
    '/register',
    [bodyValidation(authValidator.registrationSchema)],
    asyncErrorHandler(AuthController.register)
);

AuthRoute.get('/verify', asyncErrorHandler(AuthController.verify));
AuthRoute.post('/reverify', [mustBeAuthenticated], asyncErrorHandler(AuthController.reverify));

AuthRoute.post(
    '/forgot/password',
    [bodyValidation(authValidator.forgotPasswordSchema)],
    asyncErrorHandler(AuthController.initiatePasswordReset)
);

AuthRoute.post(
    '/reset/password',
    [queryValidation(authValidator.resetPasswordSchema)],
    asyncErrorHandler(AuthController.resetPassword)
);

AuthRoute.post(
    '/reset/email',
    [mustBeAuthenticated, bodyValidation(authValidator.resetEmailSchema)],
    asyncErrorHandler(AuthController.initiateEmailReset)
);

export { AuthRoute };
