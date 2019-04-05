import * as express from 'express';
import * as GameController from '../controllers/game/Game.controller';
import * as LiveGameController from '../controllers/game/LiveGame.controller';
import { mustBeRole } from '../middlewares/Auth.middleware';
import { UserRole } from '../models/User';
// import { createValidator } from '../routes/validators/Game.validator';
import { asyncErrorHandler } from './handlers';

export const GameRoute: express.Router = express
    .Router()
    .get('/', asyncErrorHandler(GameController.all))
    .post('/', mustBeRole(UserRole.MODERATOR), asyncErrorHandler(GameController.create))
    .get('/latest', asyncErrorHandler(GameController.latest))
    .get('/:id', asyncErrorHandler(GameController.show))
    .patch('/:id', mustBeRole(UserRole.MODERATOR), asyncErrorHandler(GameController.update))
    .post('/:id/activate', mustBeRole(UserRole.MODERATOR), asyncErrorHandler(GameController.activate))
    .post('/:id/end', mustBeRole(UserRole.MODERATOR), asyncErrorHandler(LiveGameController.end))
    .post('/:id/player', mustBeRole(UserRole.MODERATOR), asyncErrorHandler(LiveGameController.addPlayer))
    .delete('/:id/player', mustBeRole(UserRole.MODERATOR), asyncErrorHandler(LiveGameController.removePlayer))
    .get('/season/:season', asyncErrorHandler(GameController.findAllBySeason));
