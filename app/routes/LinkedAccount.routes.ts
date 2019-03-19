import * as express from 'express';
import { LinkedAccountController } from '../controllers/user/LinkedAccount.controller';
import { mustOwnUser } from '../middlewares/OwnsUser';

export const LinkedAccountRoute: express.Router = express
    .Router()
    .get('/:user/linked-accounts', mustOwnUser, LinkedAccountController.all)
    .delete('/:user/linked-accounts/:provider', mustOwnUser, LinkedAccountController.remove);
