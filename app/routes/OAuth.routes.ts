import * as express from 'express';
import { OAuthController } from '../controllers/auth/OAuth.controller';
import { mustBeAuthenticated } from '../middlewares/Auth.middleware';
import { asyncErrorHandler } from './handlers';

export const OAuthRoute: express.Router = express
    .Router()
    .get('/discord', mustBeAuthenticated, asyncErrorHandler(OAuthController.discord));
