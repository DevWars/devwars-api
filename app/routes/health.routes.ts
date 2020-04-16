import * as express from 'express';

import { mustBeAuthenticated, mustBeMinimumRole } from '../middleware/Auth.middleware';
import * as HealthController from '../controllers/Health.controller';
import { UserRole } from '../models/User';

const HealthRoute = express.Router();

HealthRoute.get('/', HealthController.index);

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
