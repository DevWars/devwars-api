import * as express from 'express';
import {HealthController} from '../controllers/Health.controller';

export const HealthRoute: express.Router = express.Router()
    .get('/health', HealthController.index);
