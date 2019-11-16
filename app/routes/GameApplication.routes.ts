import * as express from 'express';

import * as GameApplicationController from '../controllers/game/GameApplication.controller';
import { bindGameFromGameParam, bindGameScheduleFromScheduleParam } from '../middleware/GameApplication.middleware';
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
    [bindGameFromGameParam],
    asyncErrorHandler(GameApplicationController.findUserApplicationsByGame)
);

GameApplicationRoute.get(
    '/schedule/:schedule',
    [bindGameScheduleFromScheduleParam],
    asyncErrorHandler(GameApplicationController.findApplicationsBySchedule)
);

GameApplicationRoute.post(
    '/schedule/:schedule',
    [mustBeAuthenticated, bindGameScheduleFromScheduleParam],
    asyncErrorHandler(GameApplicationController.applyToSchedule)
);

GameApplicationRoute.delete(
    '/schedule/:schedule',
    [mustBeAuthenticated, bindGameScheduleFromScheduleParam],
    asyncErrorHandler(GameApplicationController.resignFromSchedule)
);

GameApplicationRoute.post(
    '/game/:game/username/:username',
    [mustBeAuthenticated, bindGameFromGameParam],
    asyncErrorHandler(GameApplicationController.createGameSchedule)
);

export { GameApplicationRoute };
