import * as express from 'express';
import { GameController } from '../controllers/game/Game.controller';
import { mustBeRole } from '../middlewares/Auth.middleware';
import { UserRole } from '../models/User';

export const GameRoute: express.Router = express.Router();
// .get('/', GameController.all)
// .post('/', GameController.createGame)
// .get('/latest', GameController.latest)
// .get('/:game', GameController.show)
// .put('/:game', mustBeRole(UserRole.ADMIN), GameController.update)
// .post('/:id/ended', mustBeRole(UserRole.ADMIN), GameController.end)
// .get('/season/:season', GameController.bySeason)
// .get('/status/:status', GameController.byStatus);
