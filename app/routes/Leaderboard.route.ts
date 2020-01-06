import * as express from 'express';
import * as LeaderboardController from '../controllers/user/Leaderboard.controller';
import { wrapAsync } from './handlers';

export const LeaderboardRoute: express.Router = express
    .Router()
    .get('/users', wrapAsync(LeaderboardController.leaderboards));
