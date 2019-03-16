import * as express from 'express';
import {SettingsController} from '../controllers/user/Settings.controller';
import {mustOwnUser} from '../middlewares/OwnsUser';
import {validates} from '../middlewares/Validates.middleware';
import {SettingsChangeRequestValidator} from '../request/ISetttingsChangeRequest';

export const UserSettingsRoute: express.Router = express.Router()
    .post('/:user/settings', mustOwnUser, validates(SettingsChangeRequestValidator), SettingsController.update);
