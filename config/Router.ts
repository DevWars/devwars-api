import * as express from 'express';
import { ActivityRoute } from '../app/routes/Activity.route';
import { AuthRoute } from '../app/routes/Auth.routes';
import { BadgeRoute } from '../app/routes/Badge.route';
// import { GameRoute } from '../app/routes/Game.route';
// import { GameApplicationRoute } from '../app/routes/GameApplication.route';
import { GameTeamRoute } from '../app/routes/GameTeam.route';
import { HealthRoute } from '../app/routes/Health.route';
import { JWTRoute } from '../app/routes/Jwt.route';
import { LeaderboardRoute } from '../app/routes/Leaderboard.route';
import { LinkedAccountRoute } from '../app/routes/LinkedAccount.routes';
import { OAuthRoute } from '../app/routes/OAuth.route';
import { PlayerRoute } from '../app/routes/Player.route';
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
    // {
    //     handler: GameRoute,
    //     middleware: [],
    //     path: '/game',
    // },
    {
        handler: GameTeamRoute,
        middleware: [],
        path: '/game',
    },
    {
        handler: PlayerRoute,
        middleware: [],
        path: '/game',
    },
    // {
    //     handler: GameApplicationRoute,
    //     middleware: [],
    //     path: '/game',
    // },
    {
        handler: ActivityRoute,
        middleware: [],
        path: '/activity',
    },
    {
        handler: LeaderboardRoute,
        middleware: [],
        path: '/leaderboard',
    },
    {
        handler: BadgeRoute,
        middleware: [],
        path: '/badge',
    },
    {
        handler: LinkedAccountRoute,
        middleware: [],
        path: '/user',
    },
    {
        handler: OAuthRoute,
        middleware: [],
        path: '/oauth',
    },
    {
        handler: UserRoute,
        middleware: [],
        path: '/user',
    },
];
