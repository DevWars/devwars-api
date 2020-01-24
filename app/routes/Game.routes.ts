import * as express from 'express';

import * as LiveGameController from '../controllers/game/LiveGame.controller';
import * as GameController from '../controllers/game/Game.controller';

import { bindGameFromGameParam } from '../middleware/GameApplication.middleware';
import { mustBeRole, mustBeAuthenticated } from '../middleware/Auth.middleware';

import { wrapAsync } from './handlers';
import { UserRole } from '../models/User';

import {
    createGameSchema,
    PatchGameSchema,
    addGamePlayerSchema,
    removeGamePlayerSchema,
} from './validators/game.validator';
import { bodyValidation } from './validators';

const GameRoute: express.Router = express.Router();

GameRoute.get('/', wrapAsync(GameController.all));

GameRoute.post(
    '/',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bodyValidation(createGameSchema)],
    wrapAsync(GameController.create)
);

GameRoute.get('/latest', wrapAsync(GameController.latest));
GameRoute.get('/active', wrapAsync(GameController.active));
GameRoute.get('/:game', [bindGameFromGameParam], wrapAsync(GameController.show));

GameRoute.patch(
    '/:game',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromGameParam, bodyValidation(PatchGameSchema)],
    wrapAsync(GameController.update)
);

GameRoute.delete(
    '/:game',
    [mustBeAuthenticated, mustBeRole(UserRole.ADMIN), bindGameFromGameParam],
    wrapAsync(GameController.remove)
);

GameRoute.post(
    '/:game/activate',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromGameParam],
    wrapAsync(GameController.activate)
);

GameRoute.post(
    '/:game/end',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromGameParam],
    wrapAsync(LiveGameController.end)
);

GameRoute.post('/:game/end/bot', [mustBeRole(null, true), bindGameFromGameParam], wrapAsync(LiveGameController.end));

GameRoute.post(
    '/:game/player',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromGameParam, bodyValidation(addGamePlayerSchema)],
    wrapAsync(LiveGameController.addPlayer)
);

GameRoute.delete(
    '/:game/player',
    [
        mustBeAuthenticated,
        mustBeRole(UserRole.MODERATOR),
        bindGameFromGameParam,
        bodyValidation(removeGamePlayerSchema),
    ],
    wrapAsync(LiveGameController.removePlayer)
);

GameRoute.get('/season/:season', wrapAsync(GameController.findAllBySeason));

export { GameRoute };
