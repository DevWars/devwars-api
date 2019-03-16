import * as express from 'express';
import {LeaderboardController} from '../controllers/Leaderboard.controller';

export const LeaderboardRoute: express.Router = express.Router()
    .get('/users', LeaderboardController.users);
