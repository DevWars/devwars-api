import * as express from 'express';

import * as HealthController from '../controllers/Health.controller';
import { asyncErrorHandler } from './handlers';

const HealthRoute = express.Router();

HealthRoute.get('/health', asyncErrorHandler(HealthController.index));

export { HealthRoute };
