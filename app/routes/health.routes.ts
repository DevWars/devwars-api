import * as express from 'express';

import { mustBeAuthenticated, mustBeMinimumRole } from '../middleware/authentication.middleware';
import * as HealthController from '../controllers/health.controller';
import { UserRole } from '../models/user.model';

const HealthRoute = express.Router();

HealthRoute.get('/', HealthController.getBasicServerHealth);

HealthRoute.get(
    '/logs/',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR)],
    HealthController.getAllServerLogs
);

HealthRoute.get(
    '/logs/error',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR)],
    HealthController.getErrorServerLogs
);

export { HealthRoute };
