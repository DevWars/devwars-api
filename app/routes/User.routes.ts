import * as express from 'express';
import * as multer from 'multer';

import { BadgeController } from '../controllers/Badge.controller';
import { AvatarController } from '../controllers/user/Avatar.controller';
import { SettingsController } from '../controllers/user/Settings.controller';
import { UserStatsController } from '../controllers/user/UserStats.controller';
import { mustOwnUser } from '../middlewares/OwnsUser';
import { validates } from '../middlewares/Validates.middleware';
import { SettingsChangeRequestValidator } from '../request/ISetttingsChangeRequest';

const upload = multer({ dest: 'uploads/' });

export const UserRoute: express.Router = express
    .Router()
    .get('/:user/badges', BadgeController.forUser)
    .post('/:user/settings', mustOwnUser, validates(SettingsChangeRequestValidator), SettingsController.update)
    .post('/:user/avatar', upload.single('avatar'), AvatarController.store)
    .get('/:user/stats', UserStatsController.forUser);
