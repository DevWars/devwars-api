import * as express from 'express';
import * as multer from 'multer';

import * as UserController from '../controllers/user/User.controller';
import * as UserProfileController from '../controllers/user/UserProfile.controller';
import * as UserStatsController from '../controllers/user/UserStats.controller';
import * as UserGameStatsController from '../controllers/user/UserGameStats.controller';
import * as UserAvatarController from '../controllers/user/UserAvatar.controller';

import { mustOwnUser } from '../middlewares/OwnsUser';

const upload = multer({ dest: 'uploads/' });

export const UserRoute: express.Router = express
    .Router()
    .get('/', UserController.all)
    .get('/:id', UserController.show)
    .put('/:id', mustOwnUser, UserController.update)
    .put('/:id/avatar', mustOwnUser, upload.single('avatar'), UserAvatarController.store)
    .get('/:id/stats', UserStatsController.forUser)
    .post('/:id/stats', UserStatsController.create)
    .get('/:id/stats/game', UserGameStatsController.forUser)
    .get('/:id/profile', UserProfileController.show)
    .put('/:id/profile', mustOwnUser, UserProfileController.update);
