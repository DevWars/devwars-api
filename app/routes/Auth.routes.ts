import * as express from 'express';

import * as authValidator from './validators/authentication.validator';
import * as AuthController from '../controllers/authentication/Authentication.controller';
import { mustBeAuthenticated, mustBeRoleOrOwner } from '../middleware/Auth.middleware';

import { bodyValidation, queryValidation } from './validators';
import { wrapAsync } from './handlers';
import { UserRole } from '../models/User';

const AuthRoute: express.Router = express.Router();

AuthRoute.get('/user', [mustBeAuthenticated], wrapAsync(AuthController.currentUser));
AuthRoute.post('/login', [bodyValidation(authValidator.loginSchema)], wrapAsync(AuthController.login));
AuthRoute.post('/logout', [mustBeAuthenticated], wrapAsync(AuthController.logout));
AuthRoute.post('/register', [bodyValidation(authValidator.registrationSchema)], wrapAsync(AuthController.register));
AuthRoute.get('/verify', wrapAsync(AuthController.verify));
AuthRoute.post('/reverify', [mustBeAuthenticated], wrapAsync(AuthController.reverify));

AuthRoute.post(
    '/forgot/password',
    [bodyValidation(authValidator.forgotPasswordSchema)],
    wrapAsync(AuthController.initiatePasswordReset)
);

AuthRoute.post(
    '/reset/password',
    [queryValidation(authValidator.resetPasswordSchema)],
    wrapAsync(AuthController.resetPassword)
);

AuthRoute.post(
    '/reset/email',
    [mustBeAuthenticated, bodyValidation(authValidator.resetEmailSchema)],
    wrapAsync(AuthController.initiateEmailReset)
);

export { AuthRoute };
