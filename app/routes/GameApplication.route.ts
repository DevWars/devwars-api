import * as express from 'express';

import { mustBeAuthenticated, mustBeRole } from '../middlewares/Auth.middleware';

import { GameApplicationController } from '../controllers/game/GameApplication.controller';
import { UserRole } from '../models/User';

export const GameApplicationRoute: express.Router = express.Router();
// .get('/applications/mine', mustBeAuthenticated, GameApplicationController.mine)
// .get('/entered/mine', mustBeAuthenticated, GameApplicationController.entered)
// .get('/:game/applications', GameApplicationController.forGame)
// .post('/:game/applications/:username', mustBeRole(UserRole.ADMIN), GameApplicationController.applyByUsername)
// .post('/:game/applications', mustBeAuthenticated, GameApplicationController.apply);
