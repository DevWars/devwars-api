import * as express from 'express';
import * as GameApplicationController from '../controllers/game/GameApplication.controller';
import { mustBeAuthenticated, mustBeRole } from '../middlewares/Auth.middleware';
import { UserRole } from '../models/User';
import { asyncErrorHandler } from './handlers';

export const GameApplicationRoute: express.Router = express
    .Router()
    .get('/mine', mustBeAuthenticated, asyncErrorHandler(GameApplicationController.mine))
    .get('/entered/mine', mustBeAuthenticated, asyncErrorHandler(GameApplicationController.entered))
    .get('/:schedule', asyncErrorHandler(GameApplicationController.findBySchedule))
    .post('/:schedule', mustBeAuthenticated, asyncErrorHandler(GameApplicationController.applyByUsername));
