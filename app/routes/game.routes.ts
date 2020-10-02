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

GameRoute.get('/', wrapAsync(GameController.gatheringAllGamesWithPaging));

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
    wrapAsync(GameController.updateGameById)
);

GameRoute.delete(
    '/:game',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.ADMIN), bindGameByParamId('game')],
    wrapAsync(GameController.deleteGameById)
);

/*******************************
 *  Source
 ******************************/

GameRoute.get('/:game/source', [bindGameByParamId('game')], wrapAsync(GameController.getGamesRelatedSourceDetails));

GameRoute.get(
    '/:game/source/:team/',
    [bindGameByParamId('game')],
    wrapAsync(GameController.getGamesRelatedSourcesByTeam)
);

GameRoute.get(
    '/:game/source/:team/:language',
    [bindGameByParamId('game')],
    wrapAsync(GameController.getGamesRelatedSourcesByTeamAndLanguage)
);

/*******************************
 *  Actions
 ******************************/

GameRoute.post(
    '/:game/actions/activate',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR), bindGameByParamId('game')],
    wrapAsync(GameController.activateById)
);

GameRoute.post(
    '/:game/actions/end',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR, true), bindGameByParamId('game')],
    wrapAsync(LiveGameController.endGameById)
);

/*******************************
 *  Players
 ******************************/

GameRoute.get(
    '/:game/players',
    [bindGameByParamId('game')],
    wrapAsync(LiveGameController.GetAllGameAssignedPlayersById)
);

GameRoute.post(
    '/:game/players',
    [
        mustBeAuthenticated,
        mustBeMinimumRole(UserRole.MODERATOR),
        bindGameByParamId('game'),
        bodyValidation(addGamePlayerSchema),
    ],
    wrapAsync(LiveGameController.assignPlayerToGameById)
);

GameRoute.delete(
    '/:game/players',
    [
        mustBeAuthenticated,
        mustBeMinimumRole(UserRole.MODERATOR),
        bindGameByParamId('game'),
        bodyValidation(removeGamePlayerSchema),
    ],
    wrapAsync(LiveGameController.removePlayerFromGameById)
);

/*******************************
 *  Applications
 ******************************/

GameRoute.get(
    '/:game/applications',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR), bindGameByParamId('game')],
    wrapAsync(LiveGameController.getAllGameApplicationsById)
);

GameRoute.post(
    '/:game/applications/:user',
    [
        mustBeAuthenticated,
        bindGameByParamId('game'),
        bindUserByParamId('user'),
        mustBeRoleOrOwner(UserRole.MODERATOR, true),
    ],
    wrapAsync(LiveGameController.applyToGameWithApplicationByIdAndGameId)
);

GameRoute.get(
    '/:game/applications/:user',
    [mustBeAuthenticated, bindGameByParamId('game'), bindUserByParamId('user'), mustBeRoleOrOwner(UserRole.MODERATOR)],
    wrapAsync(LiveGameController.getApplicationByUserIdAndGameId)
);

GameRoute.delete(
    '/:game/applications/:user',
    [mustBeAuthenticated, bindGameByParamId('game'), bindUserByParamId('user'), mustBeRoleOrOwner(UserRole.MODERATOR)],
    wrapAsync(LiveGameController.deleteApplicationById)
);

export { GameRoute };
