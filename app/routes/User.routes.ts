import * as express from 'express';
import * as multer from 'multer';

import * as UserController from '../controllers/user/User.controller';
import * as UserProfileController from '../controllers/user/UserProfile.controller';
import * as UserStatsController from '../controllers/user/UserStats.controller';
import * as UserGameStatsController from '../controllers/user/UserGameStats.controller';
import * as UserAvatarController from '../controllers/user/UserAvatar.controller';

import { UserRole } from '../models/User';
import { mustOwnUser } from '../middlewares/OwnsUser';
import { mustBeRole, mustBeAuthenticated } from '../middlewares/Auth.middleware';
import { asyncErrorHandler } from './handlers';

const upload = multer({ dest: 'uploads/' });

export const UserRoute: express.Router = express
    .Router()
    .get('/', [mustBeAuthenticated, mustBeRole(UserRole.ADMIN)], asyncErrorHandler(UserController.all))
    .get('/:id', asyncErrorHandler(UserController.show))
    .put('/:id', [mustBeAuthenticated, mustOwnUser], asyncErrorHandler(UserController.update))
    .put(
        '/:id/avatar',
        [mustBeAuthenticated, mustOwnUser],
        upload.single('avatar'),
        asyncErrorHandler(UserAvatarController.store)
    )
    .get('/:id/stats', asyncErrorHandler(UserStatsController.forUser))
    .post('/:id/stats', asyncErrorHandler(UserStatsController.create))
    .get('/stats/coins', asyncErrorHandler(UserStatsController.getCoins))
    .get('/:id/stats/game', asyncErrorHandler(UserGameStatsController.forUser))
    .get('/:id/profile', asyncErrorHandler(UserProfileController.show))
    .patch('/:id/profile', [mustBeAuthenticated, mustOwnUser], asyncErrorHandler(UserProfileController.update));
