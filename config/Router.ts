import * as express from 'express';
import { ActivityRoute } from '../app/routes/Activity.routes';
import { AuthRoute } from '../app/routes/Auth.routes';
import { GameRoute } from '../app/routes/Game.routes';
import { GameScheduleRoute } from '../app/routes/GameSchedule.routes';
import { GameApplicationRoute } from '../app/routes/GameApplication.routes';
import { HealthRoute } from '../app/routes/Health.route';
import { LeaderboardRoute } from '../app/routes/Leaderboard.route';
import { LinkedAccountRoute } from '../app/routes/LinkedAccount.routes';
import { UserRoute } from '../app/routes/User.routes';
import { TempRoute } from '../app/routes/Temp.routes';

interface IROUTER {
    path: string;
    middleware: any[];
    handler: express.Router;
}

export const ROUTER: IROUTER[] = [
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
