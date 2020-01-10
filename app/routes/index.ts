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
import { ContactRoute } from './contact.routes';

interface IRoute {
    path: string;
    handler: express.Router;
}

export const Routes: IRoute[] = [
    {
        handler: HealthRoute,
        path: '/',
    },
    {
        handler: AuthRoute,
        path: '/auth',
    },
    {
        handler: GameRoute,
        path: '/games',
    },
    {
        handler: GameScheduleRoute,
        path: '/schedules',
    },
    {
        handler: GameApplicationRoute,
        path: '/applications',
    },
    {
        handler: ActivityRoute,
        path: '/activities',
    },
    {
        handler: LeaderboardRoute,
        path: '/leaderboards',
    },
    {
        handler: LinkedAccountRoute,
        path: '/oauth',
    },
    {
        handler: UserRoute,
        path: '/users',
    },
    {
        handler: ContactRoute,
        path: '/contact',
    },

    // TEMP: To support cookie authentication for Old Editor
    {
        handler: TempRoute,
        path: '/user',
    },
];
