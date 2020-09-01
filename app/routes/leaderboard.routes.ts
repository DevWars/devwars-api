import * as express from 'express';
import * as LeaderboardController from '../controllers/leaderboard.controller';
import { wrapAsync } from './handlers';

export const LeaderboardRoute: express.Router = express
    .Router()
    .get('/users', wrapAsync(LeaderboardController.getUsersLeaderboards));
