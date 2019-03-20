import * as express from 'express';
import { JWTController } from '../controllers/auth/Jwt.controller';

export const JWTRoute: express.Router = express.Router().post('/', JWTController.Index);
