import * as express from 'express';
import * as GameScheduleController from '../controllers/game/GameSchedule.controller';

import { mustBeRole } from '../middlewares/Auth.middleware';
import { UserRole } from '../models/User';
import { createValidator, updateValidator } from './validators/GameSchedule.validator';

export const GameScheduleRoute: express.Router = express
    .Router()
    .get('/', GameScheduleController.all)
    .post('/', [mustBeRole(UserRole.MODERATOR), ...createValidator], GameScheduleController.create)
    .get('/latest', GameScheduleController.latest)
    .get('/:id', GameScheduleController.show)
    .patch('/:id', [mustBeRole(UserRole.MODERATOR), ...updateValidator], GameScheduleController.update)
    .get('/status/:status', GameScheduleController.byStatus);
