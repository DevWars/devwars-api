import * as express from 'express';
import * as GameController from '../controllers/game/Game.controller';
import * as LiveGameController from '../controllers/game/LiveGame.controller';
import { mustBeRole } from '../middlewares/Auth.middleware';
import { UserRole } from '../models/User';
import { createValidator } from '../routes/validators/Game.validator';

export const GameRoute: express.Router = express
    .Router()
    .get('/', GameController.all)
    .post('/', [mustBeRole(UserRole.MODERATOR), ...createValidator], GameController.create)
    .get('/latest', GameController.latest)
    .get('/:id', GameController.show)
    .patch('/:id', mustBeRole(UserRole.MODERATOR), GameController.update)
    .post('/:id/end', mustBeRole(UserRole.MODERATOR), LiveGameController.end)
    .post('/:id/player', mustBeRole(UserRole.MODERATOR), LiveGameController.addPlayer)
    .delete('/:id/player', mustBeRole(UserRole.MODERATOR), LiveGameController.removePlayer)
    .get('/season/:season', GameController.findAllBySeason);
