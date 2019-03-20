import * as express from 'express';
import * as GameScheduleController from '../controllers/game/GameSchedule.controller';

import { mustBeRole } from '../middlewares/Auth.middleware';
import { UserRole } from '../models/User';

export const GameScheduleRoute: express.Router = express
    .Router()
    .get('/', GameScheduleController.all)
    .post('/', GameScheduleController.create)
    .get('/latest', GameScheduleController.latest)
    .get('/:id', GameScheduleController.show)
    .put('/:id', mustBeRole(UserRole.ADMIN), GameScheduleController.update)
    .get('/status/:status', GameScheduleController.byStatus);
