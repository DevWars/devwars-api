import * as express from 'express';
import * as GameScheduleController from '../controllers/game/GameSchedule.controller';

import { mustBeRole } from '../middlewares/Auth.middleware';
import { UserRole } from '../models/User';
// import { createValidator, updateValidator } from './validators/GameSchedule.validator';
import { asyncErrorHandler } from './handlers'

export const GameScheduleRoute: express.Router = express
    .Router()
    .get('/', asyncErrorHandler(GameScheduleController.all))
    .post('/', mustBeRole(UserRole.MODERATOR), asyncErrorHandler(GameScheduleController.create))
    .get('/latest', asyncErrorHandler(GameScheduleController.latest))
    .get('/:id', asyncErrorHandler(GameScheduleController.show))
    .patch('/:id', mustBeRole(UserRole.MODERATOR), asyncErrorHandler(GameScheduleController.update))
    .get('/status/:status', asyncErrorHandler(GameScheduleController.byStatus));
