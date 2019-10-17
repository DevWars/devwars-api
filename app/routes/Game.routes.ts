import * as express from 'express';

import * as LiveGameController from '../controllers/game/liveGame.controller';
import * as GameController from '../controllers/game/game.controller';

import { mustBeRole, mustBeAuthenticated } from '../middleware/Auth.middleware';
import { isTwitchBot } from '../middleware/isTwitchBot.middleware';

import { asyncErrorHandler } from './handlers';
import { UserRole } from '../models/User';

const GameRoute: express.Router = express.Router();

GameRoute.get('/', asyncErrorHandler(GameController.all));

GameRoute.post('/', [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR)], asyncErrorHandler(GameController.create));
GameRoute.get('/latest', asyncErrorHandler(GameController.latest));
GameRoute.get('/active', asyncErrorHandler(GameController.active));
GameRoute.get('/:id', asyncErrorHandler(GameController.show));

GameRoute.patch(
    '/:id',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR)],
    asyncErrorHandler(GameController.update)
);

GameRoute.delete('/:id', [mustBeAuthenticated, mustBeRole(UserRole.ADMIN)], asyncErrorHandler(GameController.remove));

GameRoute.post(
    '/:id/activate',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR)],
    asyncErrorHandler(GameController.activate)
);

GameRoute.post(
    '/:id/end',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR)],
    asyncErrorHandler(LiveGameController.end)
);

GameRoute.post('/:id/end/bot', isTwitchBot, asyncErrorHandler(LiveGameController.end));

GameRoute.post(
    '/:id/player',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR)],
    asyncErrorHandler(LiveGameController.addPlayer)
);

GameRoute.delete(
    '/:id/player',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR)],
    asyncErrorHandler(LiveGameController.removePlayer)
);

GameRoute.get('/season/:season', asyncErrorHandler(GameController.findAllBySeason));

export { GameRoute };
