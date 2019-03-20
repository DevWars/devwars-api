import * as express from 'express';
import * as multer from 'multer';

import * as UserController from '../controllers/user/User.controller';
import * as UserProfileController from '../controllers/user/UserProfile.controller';
import * as UserStatsController from '../controllers/user/UserStats.controller';
import * as UserAvatarController from '../controllers/user/UserAvatar.controller';

import { mustOwnUser } from '../middlewares/OwnsUser';

const upload = multer({ dest: 'uploads/' });

export const UserRoute: express.Router = express
    .Router()
    .put('/:user/update', mustOwnUser, UserController.update)
    .put('/:user/avatar', upload.single('avatar'), UserAvatarController.store)
    .get('/:user/stats', UserStatsController.forUser)
    .post('/:user/stats/create', UserStatsController.create)
    .get('/:user/profile', UserProfileController.show)
    .get('/:user/profile/update', UserProfileController.update);
