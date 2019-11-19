import * as express from 'express';
import * as multer from 'multer';

import * as UserController from '../controllers/user/User.controller';
import * as UserProfileController from '../controllers/user/UserProfile.controller';
import * as UserStatsController from '../controllers/user/UserStats.controller';
import * as UserGameStatsController from '../controllers/user/UserGameStats.controller';
import * as UserAvatarController from '../controllers/user/UserAvatar.controller';

import User, { UserRole } from '../models/User';
import { mustBeRole, mustBeAuthenticated, mustBeRoleOrOwner } from '../middleware/Auth.middleware';
import { asyncErrorHandler } from './handlers';
import { bodyValidation } from './validators';
import { statsSchema, profileSchema, updateUserSchema } from './validators/user.validator';

const upload = multer({ dest: 'uploads/' });
const UserRoute: express.Router = express.Router();

UserRoute.get('/', [mustBeAuthenticated, mustBeRole(UserRole.ADMIN)], asyncErrorHandler(UserController.all));
UserRoute.get('/:id', asyncErrorHandler(UserController.show));

UserRoute.put(
    '/:id',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bodyValidation(updateUserSchema)],
    asyncErrorHandler(UserController.update)
);

UserRoute.put(
    '/:id/avatar',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), upload.single('avatar')],
    asyncErrorHandler(UserAvatarController.store)
);

UserRoute.get('/:id/stats', asyncErrorHandler(UserStatsController.forUser));
UserRoute.post('/:id/stats', [bodyValidation(statsSchema)], asyncErrorHandler(UserStatsController.create));
UserRoute.get('/stats/coins', asyncErrorHandler(UserStatsController.getCoins));
UserRoute.get('/:id/stats/game', asyncErrorHandler(UserGameStatsController.forUser));

UserRoute.get(
    '/:id/profile',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR)],
    asyncErrorHandler(UserProfileController.show)
);

UserRoute.patch(
    '/:id/profile',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.ADMIN), bodyValidation(profileSchema)],
    asyncErrorHandler(UserProfileController.update)
);

export { UserRoute };
