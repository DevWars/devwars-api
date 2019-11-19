import * as express from 'express';

import * as GameScheduleController from '../controllers/game/GameSchedule.controller';
import { mustBeRole, mustBeAuthenticated } from '../middleware/Auth.middleware';
import { asyncErrorHandler } from './handlers';
import { UserRole } from '../models/User';
import { bodyValidation } from './validators';
import { createGameScheduleSchema, updateGameScheduleSchema } from './validators/gameSchedule.validator';
import { bindScheduleFromScheduleParam } from '../middleware/GameSchedule.middleware';

const GameScheduleRoute: express.Router = express.Router();

GameScheduleRoute.get('/', asyncErrorHandler(GameScheduleController.all));

GameScheduleRoute.post(
    '/',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bodyValidation(createGameScheduleSchema)],
    asyncErrorHandler(GameScheduleController.create)
);

GameScheduleRoute.get('/latest', asyncErrorHandler(GameScheduleController.latest));
GameScheduleRoute.get('/:schedule', [bindScheduleFromScheduleParam], asyncErrorHandler(GameScheduleController.show));

GameScheduleRoute.patch(
    '/:schedule',
    [
        mustBeAuthenticated,
        mustBeRole(UserRole.MODERATOR),
        bindScheduleFromScheduleParam,
        bodyValidation(updateGameScheduleSchema),
    ],
    asyncErrorHandler(GameScheduleController.update)
);

// GameScheduleRoute.post('/:id/activate', [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR)],
// asyncErrorHandler(GameScheduleController.activate))

GameScheduleRoute.post(
    '/:schedule/activate',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR), bindScheduleFromScheduleParam],
    asyncErrorHandler(GameScheduleController.activate)
);

GameScheduleRoute.get('/status/:status', asyncErrorHandler(GameScheduleController.byStatus));

export { GameScheduleRoute };
