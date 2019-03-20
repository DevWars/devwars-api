import * as express from 'express';
import * as LeaderboardController from '../controllers/user/Leaderboard.controller';

export const LeaderboardRoute: express.Router = express.Router().get('/users', LeaderboardController.leaderboards);
