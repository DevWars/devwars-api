import * as express from 'express';

import * as LiveGameController from '../controllers/game/LiveGame.controller';
import * as GameController from '../controllers/game/Game.controller';

import { bindGameFromGameParam } from '../middleware/GameApplication.middleware';
import { mustBeRole, mustBeAuthenticated } from '../middleware/Auth.middleware';

import { asyncErrorHandler } from './handlers';
import { UserRole } from '../models/User';

import {
    createGameSchema,
    PatchGameSchema,
    addGamePlayerSchema,
    removeGamePlayerSchema,
} from './validators/game.validator';
import { bodyValidation } from './validators';

const GameRoute: express.Router = express.Router();

GameRoute.get('/', asyncErrorHandler(GameController.all));

GameRoute.post(
    '/',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bodyValidation(createGameSchema)],
    asyncErrorHandler(GameController.create)
);

GameRoute.get('/latest', asyncErrorHandler(GameController.latest));
GameRoute.get('/active', asyncErrorHandler(GameController.active));
GameRoute.get('/:game', [bindGameFromGameParam], asyncErrorHandler(GameController.show));

GameRoute.patch(
    '/:game',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromGameParam, bodyValidation(PatchGameSchema)],
    asyncErrorHandler(GameController.update)
);

GameRoute.delete(
    '/:game',
    [mustBeAuthenticated, mustBeRole(UserRole.ADMIN), bindGameFromGameParam],
    asyncErrorHandler(GameController.remove)
);

GameRoute.post(
    '/:game/activate',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromGameParam],
    asyncErrorHandler(GameController.activate)
);

GameRoute.post(
    '/:game/end',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromGameParam],
    asyncErrorHandler(LiveGameController.end)
);

GameRoute.post(
    '/:game/end/bot',
    [mustBeRole(null, true), bindGameFromGameParam],
    asyncErrorHandler(LiveGameController.end)
);

GameRoute.post(
    '/:game/player',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromGameParam, bodyValidation(addGamePlayerSchema)],
    asyncErrorHandler(LiveGameController.addPlayer)
);

GameRoute.delete(
    '/:game/player',
    [
        mustBeAuthenticated,
        mustBeRole(UserRole.MODERATOR),
        bindGameFromGameParam,
        bodyValidation(removeGamePlayerSchema),
    ],
    asyncErrorHandler(LiveGameController.removePlayer)
);

GameRoute.get('/season/:season', asyncErrorHandler(GameController.findAllBySeason));

export { GameRoute };
