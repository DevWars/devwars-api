import * as express from 'express';
import { AuthController } from '../controllers/auth/Auth.controller';
import { ResetController } from '../controllers/user/Reset.controller';
import { mustOwnUser } from '../middlewares/OwnsUser';

export const AuthRoute: express.Router = express
    .Router()
    .get('/user', AuthController.currentUser)
    .post('/login', AuthController.login)
    .post('/logout', AuthController.logout)
    .post('/register', AuthController.register)
    .get('/verify', AuthController.verify)
    .post('/re-verify', AuthController.reVerify)
    .post('/reset', AuthController.initiatePasswordReset)
    .put('/reset', AuthController.resetPassword)
    .post('/reset/email', mustOwnUser, ResetController.email)
    .put('/reset/password', mustOwnUser, ResetController.password);
