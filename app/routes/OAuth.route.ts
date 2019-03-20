import * as express from 'express';
import { OAuthController } from '../controllers/auth/OAuth.controller';
import { mustBeAuthenticated } from '../middlewares/Auth.middleware';

export const OAuthRoute: express.Router = express
    .Router()
    .get('/discord', mustBeAuthenticated, OAuthController.discord);
