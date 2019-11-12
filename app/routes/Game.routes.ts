import * as express from 'express';

import * as LiveGameController from '../controllers/game/LiveGame.controller';
import * as GameController from '../controllers/game/Game.controller';

import { mustBeRole, mustBeAuthenticated } from '../middleware/Auth.middleware';
import { isTwitchBot } from '../middleware/isTwitchBot.middleware';

import { bindGameFromParam } from '../middleware/GameApplication.middleware';
import { asyncErrorHandler } from './handlers';
import { UserRole } from '../models/User';

const GameRoute: express.Router = express.Router();

GameRoute.get('/', asyncErrorHandler(GameController.all));

GameRoute.post('/', [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR)], asyncErrorHandler(GameController.create));
GameRoute.get('/latest', asyncErrorHandler(GameController.latest));
GameRoute.get('/active', asyncErrorHandler(GameController.active));
GameRoute.get('/:game', [bindGameFromParam], asyncErrorHandler(GameController.show));

GameRoute.patch(
    '/:game',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromParam],
    asyncErrorHandler(GameController.update)
);

GameRoute.delete(
    '/:game',
    [mustBeAuthenticated, mustBeRole(UserRole.ADMIN), bindGameFromParam],
    asyncErrorHandler(GameController.remove)
);

GameRoute.post(
    '/:game/activate',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromParam],
    asyncErrorHandler(GameController.activate)
);

GameRoute.post(
    '/:game/end',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromParam],
    asyncErrorHandler(LiveGameController.end)
);

GameRoute.post('/:game/end/bot', [isTwitchBot, bindGameFromParam], asyncErrorHandler(LiveGameController.end));

GameRoute.post(
    '/:game/player',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromParam],
    asyncErrorHandler(LiveGameController.addPlayer)
);

GameRoute.delete(
    '/:game/player',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromParam],
    asyncErrorHandler(LiveGameController.removePlayer)
);

GameRoute.get('/season/:season', asyncErrorHandler(GameController.findAllBySeason));

export { GameRoute };
