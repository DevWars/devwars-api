import * as express from 'express';
import { JWTController } from '../controllers/auth/Jwt.controller';
import { asyncErrorHandler } from './handlers';

export const JWTRoute: express.Router = express.Router().post('/', asyncErrorHandler(JWTController.Index));
