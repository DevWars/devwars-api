import * as express from 'express';

import * as GameApplicationController from '../controllers/game/GameApplication.controller';
import { bindGameFromGameParam } from '../middleware/GameApplication.middleware';
import { bindScheduleFromScheduleParam } from '../middleware/GameSchedule.middleware';
import { mustBeAuthenticated, mustBeRole } from '../middleware/Auth.middleware';
import { wrapAsync } from './handlers';
import { UserRole } from '../models/User';

const GameApplicationRoute: express.Router = express.Router();

GameApplicationRoute.get(
    '/mine',
    mustBeAuthenticated,
    wrapAsync(GameApplicationController.getCurrentUserGameApplications)
);

GameApplicationRoute.get(
    '/game/:game',
    [bindGameFromGameParam],
    wrapAsync(GameApplicationController.findUserApplicationsByGame)
);

GameApplicationRoute.get(
    '/schedule/:schedule',
    [bindScheduleFromScheduleParam],
    wrapAsync(GameApplicationController.findApplicationsBySchedule)
);

GameApplicationRoute.post(
    '/schedule/:schedule',
    [mustBeAuthenticated, bindScheduleFromScheduleParam],
    wrapAsync(GameApplicationController.applyToSchedule)
);

GameApplicationRoute.delete(
    '/schedule/:schedule',
    [mustBeAuthenticated, bindScheduleFromScheduleParam],
    wrapAsync(GameApplicationController.resignFromSchedule)
);

GameApplicationRoute.post(
    '/game/:game/username/:username',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindGameFromGameParam],
    wrapAsync(GameApplicationController.createGameSchedule)
);

export { GameApplicationRoute };
