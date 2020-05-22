import * as express from 'express';

import * as LiveGameController from '../controllers/liveGame.controller';
import * as GameController from '../controllers/game.controller';

import { mustBeMinimumRole, mustBeAuthenticated, mustBeRoleOrOwner } from '../middleware/authentication.middleware';
import { bindGameByParamId } from '../middleware/gameApplication.middleware';
import { bindUserByParamId } from '../middleware/user.middleware';

import { UserRole } from '../models/user.model';
import { wrapAsync } from './handlers';

import {
    createGameSchema,
    PatchGameSchema,
    addGamePlayerSchema,
    removeGamePlayerSchema,
} from './validators/game.validator';

import { bodyValidation } from './validators';

const GameRoute: express.Router = express.Router();

/*******************************
 *  Games/Root
 ******************************/

GameRoute.get('/', wrapAsync(GameController.getAllGames));

GameRoute.post(
    '/',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR), bodyValidation(createGameSchema)],
    wrapAsync(GameController.createNewGame)
);

/*******************************
 *  Game
 ******************************/

GameRoute.get('/:game', [bindGameByParamId('game')], wrapAsync(GameController.getGameById));

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

/*******************************
 *  Actions
 ******************************/

GameRoute.post(
    '/:game/actions/activate',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR), bindGameByParamId('game')],
    wrapAsync(GameController.activate)
);

GameRoute.post(
    '/:game/actions/end',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR, true), bindGameByParamId('game')],
    wrapAsync(LiveGameController.end)
);

/*******************************
 *  Players
 ******************************/

GameRoute.get('/:game/players', [bindGameByParamId('game')], wrapAsync(LiveGameController.GetAllGameAssignedPlayers));

GameRoute.post(
    '/:game/players',
    [
        mustBeAuthenticated,
        mustBeMinimumRole(UserRole.MODERATOR),
        bindGameByParamId('game'),
        bodyValidation(addGamePlayerSchema),
    ],
    wrapAsync(LiveGameController.assignPlayerToGame)
);

GameRoute.delete(
    '/:game/players',
    [
        mustBeAuthenticated,
        mustBeMinimumRole(UserRole.MODERATOR),
        bindGameByParamId('game'),
        bodyValidation(removeGamePlayerSchema),
    ],
    wrapAsync(LiveGameController.removePlayerFromGame)
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
