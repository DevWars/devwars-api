import * as express from 'express';
import * as GameController from '../controllers/game/Game.controller';
import { mustBeRole } from '../middlewares/Auth.middleware';
import { UserRole } from '../models/User';

export const GameRoute: express.Router = express
    .Router()
    .get('/', GameController.all)
    .post('/', mustBeRole(UserRole.MODERATOR), GameController.create)
    .get('/latest', GameController.latest)
    .get('/:id', GameController.show)
    .patch('/:id', mustBeRole(UserRole.MODERATOR), GameController.update)
    .post('/:id/end', mustBeRole(UserRole.MODERATOR), GameController.end)
    .get('/season/:season', GameController.findAllBySeason);
