import * as express from 'express';
import { ActivityRoute } from '../app/routes/Activity.route';
import { AuthRoute } from '../app/routes/Auth.routes';
import { BadgeRoute } from '../app/routes/Badge.route';
import { BlogPostRoute } from '../app/routes/BlogPost.route';
import { CompetitorRoute } from '../app/routes/Competitor.route';
import { GameRoute } from '../app/routes/Game.route';
import { GameApplicationRoute } from '../app/routes/GameApplication.route';
import { GameTeamRoute } from '../app/routes/GameTeam.route';
import { HealthRoute } from '../app/routes/Health.route';
import { JWTRoute } from '../app/routes/Jwt.route';
import { LeaderboardRoute } from '../app/routes/Leaderboard.route';
import { LinkedAccountsRoute } from '../app/routes/LinkedAccounts.route';
import { OAuthRoute } from '../app/routes/OAuth.route';
import { ObjectiveRoute } from '../app/routes/Objective.route';
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
    {
        handler: GameRoute,
        middleware: [],
        path: '/game',
    },
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
    {
        handler: GameApplicationRoute,
        middleware: [],
        path: '/game',
    },
    {
        handler: ObjectiveRoute,
        middleware: [],
        path: '/game',
    },
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
        handler: CompetitorRoute,
        middleware: [],
        path: '/user',
    },
    {
        handler: LinkedAccountsRoute,
        middleware: [],
        path: '/user',
    },
    {
        handler: BlogPostRoute,
        middleware: [],
        path: '/blog',
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
