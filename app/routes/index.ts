import * as express from 'express';
import { AuthRoute } from './auth.routes';
import { GameRoute } from './game.routes';
import { HealthRoute } from './health.routes';
import { LeaderboardRoute } from './leaderboard.routes';
import { LinkedAccountRoute } from './linkedAccount.routes';
import { UserRoute } from './user.routes';
import { ContactRoute } from './contact.routes';
import { DocsRoute } from './docs.routes';
import { SearchRoute } from './search.routes';

interface Route {
    path: string;
    handler: express.Router;
}

export const Routes: Route[] = [
    {
        handler: HealthRoute,
        path: '/health',
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
    {
        handler: SearchRoute,
        path: '/search',
    },
    {
        handler: DocsRoute,
        path: '/docs',
    },
];
