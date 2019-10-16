import * as express from 'express';

import * as GameScheduleController from '../controllers/game/gameSchedule.controller';
import { mustBeRole, mustBeAuthenticated } from '../middleware/Auth.middleware';
import { asyncErrorHandler } from './handlers';
import { UserRole } from '../models/User';

const GameScheduleRoute: express.Router = express.Router();

GameScheduleRoute.get('/', asyncErrorHandler(GameScheduleController.all));

GameScheduleRoute.post(
    '/',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR)],
    asyncErrorHandler(GameScheduleController.create)
);

GameScheduleRoute.get('/latest', asyncErrorHandler(GameScheduleController.latest));
GameScheduleRoute.get('/:id', asyncErrorHandler(GameScheduleController.show));

GameScheduleRoute.patch(
    '/:id',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR)],
    asyncErrorHandler(GameScheduleController.update)
);

// GameScheduleRoute.post('/:id/activate', [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR)],
// asyncErrorHandler(GameScheduleController.activate))

GameScheduleRoute.post(
    '/:id/activate',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR)],
    asyncErrorHandler(GameScheduleController.activate)
);

GameScheduleRoute.get('/status/:status', asyncErrorHandler(GameScheduleController.byStatus));

export { GameScheduleRoute };
