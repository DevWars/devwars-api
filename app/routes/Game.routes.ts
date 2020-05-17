import * as express from 'express';

import * as LiveGameController from '../controllers/game/LiveGame.controller';
import * as GameController from '../controllers/game/Game.controller';

import { bindGameByParamId } from '../middleware/GameApplication.middleware';
import { mustBeMinimumRole, mustBeAuthenticated, mustBeRoleOrOwner } from '../middleware/Auth.middleware';

import { wrapAsync } from './handlers';
import { UserRole } from '../models/User';

import {
    createGameSchema,
    PatchGameSchema,
    addGamePlayerSchema,
    removeGamePlayerSchema,
} from './validators/game.validator';
import { bodyValidation } from './validators';
import { bindUserByParamId } from '../middleware/User.middleware';

const GameRoute: express.Router = express.Router();

GameRoute.get('/', wrapAsync(GameController.gatheringAllGamesWithPaging));

GameRoute.post(
    '/',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR), bodyValidation(createGameSchema)],
    wrapAsync(GameController.createNewGame)
);

GameRoute.get('/latest', wrapAsync(GameController.latest));
GameRoute.get('/:game', [bindGameByParamId('game')], wrapAsync(GameController.show));

GameRoute.patch(
    '/:game',
    [
        mustBeAuthenticated,
        mustBeMinimumRole(UserRole.MODERATOR),
        bindGameByParamId('game'),
        bodyValidation(PatchGameSchema),
    ],
    wrapAsync(GameController.update)
);

GameRoute.delete(
    '/:game',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.ADMIN), bindGameByParamId('game')],
    wrapAsync(GameController.remove)
);

GameRoute.post(
    '/:game/auto-assign',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR), bindGameByParamId('game')],
    wrapAsync(GameController.autoAssignPlayers)
);

GameRoute.post(
    '/:game/activate',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR), bindGameByParamId('game')],
    wrapAsync(GameController.activate)
);

GameRoute.post(
    '/:game/end',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR), bindGameByParamId('game')],
    wrapAsync(LiveGameController.end)
);

GameRoute.post(
    '/:game/end/bot',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR, true), bindGameByParamId('game')],
    wrapAsync(LiveGameController.end)
);

/*******************************
 *  Players
 ******************************/

GameRoute.post(
    '/:game/player',
    [
        mustBeAuthenticated,
        mustBeMinimumRole(UserRole.MODERATOR),
        bindGameByParamId('game'),
        bodyValidation(addGamePlayerSchema),
    ],
    wrapAsync(LiveGameController.addPlayer)
);

GameRoute.delete(
    '/:game/player',
    [
        mustBeAuthenticated,
        mustBeMinimumRole(UserRole.MODERATOR),
        bindGameByParamId('game'),
        bodyValidation(removeGamePlayerSchema),
    ],
    wrapAsync(LiveGameController.removePlayer)
);

/*******************************
 *  Applications
 ******************************/

GameRoute.get(
    '/:game/applications',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR), bindGameByParamId('game')],
    wrapAsync(LiveGameController.getAllGameApplications)
);

GameRoute.post(
    '/:game/applications/:user',
    [mustBeAuthenticated, bindGameByParamId('game'), bindUserByParamId('user'), mustBeRoleOrOwner(UserRole.MODERATOR)],
    wrapAsync(LiveGameController.applyToGameWithApplication)
);

GameRoute.get(
    '/:game/applications/:user',
    [mustBeAuthenticated, bindGameByParamId('game'), bindUserByParamId('user'), mustBeRoleOrOwner(UserRole.MODERATOR)],
    wrapAsync(LiveGameController.getApplicationByUser)
);

GameRoute.delete(
    '/:game/applications/:user',
    [mustBeAuthenticated, bindGameByParamId('game'), bindUserByParamId('user'), mustBeRoleOrOwner(UserRole.MODERATOR)],
    wrapAsync(LiveGameController.deleteApplicationById)
);

export { GameRoute };
