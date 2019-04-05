import * as express from 'express';
import { LinkedAccountController } from '../controllers/user/LinkedAccount.controller';
import { mustOwnUser } from '../middlewares/OwnsUser';
import { asyncErrorHandler } from './handlers';

export const LinkedAccountRoute: express.Router = express
    .Router()
    .get('/:id/linked-accounts', mustOwnUser, asyncErrorHandler(LinkedAccountController.all))
    .delete('/:id/linked-accounts/:provider', mustOwnUser, asyncErrorHandler(LinkedAccountController.remove));
