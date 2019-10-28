import * as express from 'express';
import { ActivityRoute } from './Activity.routes';
import { AuthRoute } from './Auth.routes';
import { GameRoute } from './Game.routes';
import { GameScheduleRoute } from './GameSchedule.routes';
import { GameApplicationRoute } from './GameApplication.routes';
import { HealthRoute } from './health.routes';
import { LeaderboardRoute } from './Leaderboard.route';
import { LinkedAccountRoute } from './LinkedAccount.routes';
import { UserRoute } from './User.routes';
import { TempRoute } from './Temp.routes';

interface IRoute {
    path: string;
    middleware: any[];
    handler: express.Router;
}

export const Routes: IRoute[] = [
    {
        handler: HealthRoute,
        middleware: [],
        path: '/',
    },
    {
        handler: AuthRoute,
        middleware: [],
        path: '/auth',
    },
    {
        handler: GameRoute,
        middleware: [],
        path: '/games',
    },
    {
        handler: GameScheduleRoute,
        middleware: [],
        path: '/schedules',
    },
    {
        handler: GameApplicationRoute,
        middleware: [],
        path: '/applications',
    },
    {
        handler: ActivityRoute,
        middleware: [],
        path: '/activities',
    },
    {
        handler: LeaderboardRoute,
        middleware: [],
        path: '/leaderboards',
    },
    {
        handler: LinkedAccountRoute,
        middleware: [],
        path: '/oauth',
    },
    {
        handler: UserRoute,
        middleware: [],
        path: '/users',
    },

    // TEMP: To support cookie authentication for Old Editor
    {
        handler: TempRoute,
        middleware: [],
        path: '/user',
    },
];
