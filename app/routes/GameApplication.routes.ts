import * as express from 'express';

import * as GameApplicationController from '../controllers/game/GameApplication.controller';
import { bindGameFromGameParam } from '../middleware/GameApplication.middleware';
import { bindScheduleFromScheduleParam } from '../middleware/GameSchedule.middleware';
import { mustBeAuthenticated, mustBeRole } from '../middleware/Auth.middleware';
import { asyncErrorHandler } from './handlers';
import { UserRole } from '../models/User';

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
    [bindScheduleFromScheduleParam],
    asyncErrorHandler(GameApplicationController.findApplicationsBySchedule)
);

GameApplicationRoute.post(
    '/schedule/:schedule',
    [mustBeAuthenticated, bindScheduleFromScheduleParam],
    asyncErrorHandler(GameApplicationController.applyToSchedule)
);

GameApplicationRoute.delete(
    '/schedule/:schedule',
    [mustBeAuthenticated, bindScheduleFromScheduleParam],
    asyncErrorHandler(GameApplicationController.resignFromSchedule)
);

GameApplicationRoute.post(
    '/game/:game/username/:username',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromGameParam],
    asyncErrorHandler(GameApplicationController.createGameSchedule)
);

export { GameApplicationRoute };
