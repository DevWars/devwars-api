import * as express from 'express';
import * as GameApplicationController from '../controllers/game/GameApplication.controller';
import { mustBeAuthenticated, mustBeRole } from '../middlewares/Auth.middleware';
import { UserRole } from '../models/User';

export const GameApplicationRoute: express.Router = express
    .Router()
    .get('/mine', mustBeAuthenticated, GameApplicationController.mine)
    .get('/entered/mine', mustBeAuthenticated, GameApplicationController.entered)
    .get('/:schedule', GameApplicationController.findBySchedule)
    .post('/:schedule', mustBeAuthenticated, GameApplicationController.apply)
    .post('/:schedule/users/:username', mustBeRole(UserRole.ADMIN), GameApplicationController.applyByUsername);
