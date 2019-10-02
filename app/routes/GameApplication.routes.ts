import * as express from 'express';
import * as GameApplicationController from '../controllers/game/GameApplication.controller';
import { mustBeAuthenticated } from '../middlewares/Auth.middleware';
import { asyncErrorHandler } from './handlers';

export const GameApplicationRoute: express.Router = express
    .Router()
    .get('/mine', mustBeAuthenticated, asyncErrorHandler(GameApplicationController.mine))
    .get('/game/:game', asyncErrorHandler(GameApplicationController.findByGame))
    .get('/schedule/:schedule', asyncErrorHandler(GameApplicationController.findBySchedule))
    .post('/schedule/:schedule', mustBeAuthenticated, asyncErrorHandler(GameApplicationController.apply))
    .delete('/schedule/:schedule', mustBeAuthenticated, asyncErrorHandler(GameApplicationController.resign))
    .post('/game/:game/username/:username', mustBeAuthenticated, asyncErrorHandler(GameApplicationController.create));
