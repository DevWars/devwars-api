import * as express from 'express';
import {GameTeamController} from '../controllers/game/GameTeam.controller';
import {mustBeRole} from '../middlewares';
import {UserRole} from '../models';

export const GameTeamRoute: express.Router = express.Router()
    .put('/team/:team', mustBeRole(UserRole.ADMIN), GameTeamController.update)
    .get('/:game/teams', GameTeamController.forGame);
