import * as express from 'express';

import * as HealthController from '../controllers/Health.controller';
import { asyncErrorHandler } from './handlers';

const HealthRoutes = express.Router();

HealthRoutes.get('/health', asyncErrorHandler(HealthController.index));

export { HealthRoutes };
