import * as express from 'express';
import {OAuthController} from '../controllers/user/OAuth.controller';
import {mustBeAuthenticated} from '../middlewares';

export const OAuthRoute: express.Router = express.Router()
    .get('/discord', mustBeAuthenticated, OAuthController.discord);
