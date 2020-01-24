import * as express from 'express';

import * as HealthController from '../controllers/Health.controller';
import { wrapAsync } from './handlers';

const HealthRoute = express.Router();

HealthRoute.get('/health', HealthController.index);

export { HealthRoute };
