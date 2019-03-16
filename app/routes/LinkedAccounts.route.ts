import * as express from 'express';
import {LinkedAccountsController} from '../controllers/user/LinkedAccounts.controller';
import {mustOwnUser} from '../middlewares/OwnsUser';

export const LinkedAccountsRoute: express.Router = express.Router()
    .get('/:user/linked-accounts', mustOwnUser, LinkedAccountsController.all)
    .delete('/:user/linked-accounts/:provider', mustOwnUser, LinkedAccountsController.remove);
