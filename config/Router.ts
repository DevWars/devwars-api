import * as express from 'express';
import { ActivityRoute } from '../app/routes/Activity.routes';
import { AuthRoute } from '../app/routes/Auth.routes';
import { GameRoute } from '../app/routes/Game.routes';
import { GameScheduleRoute } from '../app/routes/GameSchedule.routes';
import { HealthRoute } from '../app/routes/Health.route';
import { JWTRoute } from '../app/routes/Jwt.route';
import { LeaderboardRoute } from '../app/routes/Leaderboard.route';
import { LinkedAccountRoute } from '../app/routes/LinkedAccount.routes';
import { OAuthRoute } from '../app/routes/OAuth.route';
import { UserRoute } from '../app/routes/User.routes';

interface IROUTER {
    path: string;
    middleware: any[];
    handler: express.Router;
}

export const ROUTER: IROUTER[] = [
    {
        handler: JWTRoute,
        middleware: [],
        path: '/JWT',
    },
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
    // {
    //     handler: GameApplicationRoute,
    //     middleware: [],
    //     path: '/games',
    // },
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
        path: '/users',
    },
    {
        handler: OAuthRoute,
        middleware: [],
        path: '/oauth',
    },
    {
        handler: UserRoute,
        middleware: [],
        path: '/users',
    },
];
