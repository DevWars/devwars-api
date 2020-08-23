import * as express from 'express';

import * as authValidator from './validators/authentication.validator';
import * as AuthController from '../controllers/authentication.controller';
import { mustBeAuthenticated } from '../middleware/authentication.middleware';

import { bodyValidation, queryValidation } from './validators';
import { wrapAsync } from './handlers';

const AuthRoute: express.Router = express.Router();

AuthRoute.get('/user', [mustBeAuthenticated], wrapAsync(AuthController.getCurrentAuthenticatedUser));
AuthRoute.post('/login', [bodyValidation(authValidator.loginSchema)], wrapAsync(AuthController.loginUser));
AuthRoute.post('/logout', [mustBeAuthenticated], wrapAsync(AuthController.logoutUser));

AuthRoute.post(
    '/register',
    [bodyValidation(authValidator.registrationSchema)],
    wrapAsync(AuthController.registerNewUser)
);

AuthRoute.get('/verify', wrapAsync(AuthController.verifyUser));
AuthRoute.post('/reverify', [mustBeAuthenticated], wrapAsync(AuthController.reverifyUser));

AuthRoute.post(
    '/forgot/password',
    [bodyValidation(authValidator.forgotPasswordSchema)],
    wrapAsync(AuthController.initiatePasswordReset)
);

AuthRoute.post(
    '/reset/password',
    [bodyValidation(authValidator.resetPasswordSchema)],
    wrapAsync(AuthController.resetPassword)
);

AuthRoute.put(
    '/reset/password',
    [mustBeAuthenticated, bodyValidation(authValidator.updatePasswordSchema)],
    wrapAsync(AuthController.updatePassword)
);

AuthRoute.post(
    '/reset/email',
    [mustBeAuthenticated, bodyValidation(authValidator.resetEmailSchema)],
    wrapAsync(AuthController.initiateEmailReset)
);

export { AuthRoute };
