import * as express from 'express';
import {BadgeController} from '../controllers/Badge.controller';

export const UserBadgesRoute: express.Router = express.Router()
    .get('/:user/badges', BadgeController.forUser);
