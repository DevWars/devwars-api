import * as express from 'express';

import * as GameApplicationController from '../controllers/game/GameApplication.controller';
import { bindGameFromParam, bindGameScheduleFromParam } from '../middleware/GameApplication.middleware';
import { mustBeAuthenticated } from '../middleware/Auth.middleware';
import { asyncErrorHandler } from './handlers';

const GameApplicationRoute: express.Router = express.Router();

GameApplicationRoute.get(
    '/mine',
    mustBeAuthenticated,
    asyncErrorHandler(GameApplicationController.getCurrentUserGameApplications)
);

GameApplicationRoute.get(
    '/game/:game',
    [bindGameFromParam],
    asyncErrorHandler(GameApplicationController.findUserApplicationsByGame)
);

GameApplicationRoute.get(
    '/schedule/:schedule',
    [bindGameScheduleFromParam],
    asyncErrorHandler(GameApplicationController.findApplicationsBySchedule)
);

GameApplicationRoute.post(
    '/schedule/:schedule',
    [mustBeAuthenticated, bindGameScheduleFromParam],
    asyncErrorHandler(GameApplicationController.applyToSchedule)
);

GameApplicationRoute.delete(
    '/schedule/:schedule',
    [mustBeAuthenticated, bindGameScheduleFromParam],
    asyncErrorHandler(GameApplicationController.resignFromSchedule)
);

GameApplicationRoute.post(
    '/game/:game/username/:username',
    [mustBeAuthenticated, bindGameFromParam],
    asyncErrorHandler(GameApplicationController.createGameSchedule)
);

export { GameApplicationRoute };
