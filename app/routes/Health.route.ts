import * as express from 'express';
import { HealthController } from '../controllers/Health.controller';
import { asyncErrorHandler } from './handlers';

export const HealthRoute: express.Router = express.Router().get('/health', asyncErrorHandler(HealthController.index));
