import * as express from 'express';
import * as multer from 'multer';

import * as GameApplicationsController from '../controllers/gameApplication.controller';
import * as UserGameStatsController from '../controllers/userGameStats.controller';
import * as LinkedAccountController from '../controllers/linkedAccount.controller';
import * as UserProfileController from '../controllers/userProfile.controller';
import * as UserAvatarController from '../controllers/userAvatar.controller';
import * as UserStatsController from '../controllers/userStats.controller';
import * as ActivityController from '../controllers/activity.controller';
import * as EmailController from '../controllers/email.controller';
import * as BadgeController from '../controllers/badge.controller';
import * as UserController from '../controllers/user.controller';
import { UserRole } from '../models/user.model';

import { mustBeMinimumRole, mustBeAuthenticated, mustBeRoleOrOwner } from '../middleware/authentication.middleware';
import { bindUserByParamId } from '../middleware/user.middleware';

import { profileSchema, updateUserSchema } from './validators/user.validator';
import { emailPermissionSchema } from './validators/email.validator';
import { bodyValidation } from './validators';

import { wrapAsync } from './handlers';

const upload = multer({ dest: 'uploads/' });
const UserRoute: express.Router = express.Router();

/******************************
 *  USER
 ******************************/

UserRoute.get(
    '/',
    [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR)],
    wrapAsync(UserController.getAllUsersWithPaging)
);
UserRoute.get('/:user', [bindUserByParamId('user')], wrapAsync(UserController.getUserById));

UserRoute.patch(
    '/:user',
    [
        mustBeAuthenticated,
        mustBeRoleOrOwner(UserRole.MODERATOR),
        bindUserByParamId('user'),
        bodyValidation(updateUserSchema),
    ],
    wrapAsync(UserController.updateUserById)
);

UserRoute.delete(
    '/:user',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.ADMIN), bindUserByParamId('user')],
    wrapAsync(UserController.deleteUserById)
);

/******************************
 *  AVATAR
 ******************************/

UserRoute.put(
    '/:user/avatar',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bindUserByParamId('user'), upload.single('avatar')],
    wrapAsync(UserAvatarController.updateUserAvatarById)
);

/******************************
 *  STATISTICS
 ******************************/

UserRoute.get(
    '/:user/statistics',
    [mustBeAuthenticated, bindUserByParamId('user')],
    wrapAsync(UserStatsController.getUserStatisticsById)
);

UserRoute.get(
    '/:user/statistics/game',
    [mustBeAuthenticated, bindUserByParamId('user')],
    wrapAsync(UserGameStatsController.getUserGameStatisticsById)
);

/******************************
 *  PROFILE
 ******************************/

UserRoute.get(
    '/:user/profile',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bindUserByParamId('user')],
    wrapAsync(UserProfileController.getUserProfileById)
);

UserRoute.patch(
    '/:user/profile',
    [
        mustBeAuthenticated,
        mustBeRoleOrOwner(UserRole.MODERATOR),
        bodyValidation(profileSchema),
        bindUserByParamId('user'),
    ],
    wrapAsync(UserProfileController.updateUserProfileById)
);

/******************************
 *  EMAIL
 ******************************/

UserRoute.get(
    '/:user/emails/permissions',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bindUserByParamId('user')],
    wrapAsync(EmailController.gatherEmailPermissionsById)
);

UserRoute.patch(
    '/:user/emails/permissions',
    [
        mustBeAuthenticated,
        mustBeRoleOrOwner(UserRole.MODERATOR),
        bindUserByParamId('user'),
        bodyValidation(emailPermissionSchema),
    ],
    wrapAsync(EmailController.updateEmailPermissionsById)
);

/******************************
 *  Linked Accounts
 ******************************/

UserRoute.get(
    '/:user/connections',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bindUserByParamId('user')],
    wrapAsync(LinkedAccountController.gatherAllUserConnectionsById)
);
UserRoute.get(
    '/:user/connections/:provider',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bindUserByParamId('user')],
    wrapAsync(LinkedAccountController.gatherAllUserConnectionsByProviderIdAndUserId)
);

/******************************
 *  Games
 ******************************/

UserRoute.get(
    '/:user/games',
    [mustBeAuthenticated, bindUserByParamId('user')],
    wrapAsync(GameApplicationsController.gatherUsersPlayedGamesById)
);

UserRoute.get(
    '/:user/games/:game',
    [mustBeAuthenticated, bindUserByParamId('user')],
    wrapAsync(GameApplicationsController.gatherUsersPlayedGameById)
);

/******************************
 *  Applications
 ******************************/

UserRoute.get(
    '/:user/applications',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bindUserByParamId('user')],
    wrapAsync(GameApplicationsController.gatherAllUsersApplicationsById)
);

UserRoute.get(
    '/:user/applications/:application',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bindUserByParamId('user')],
    wrapAsync(GameApplicationsController.gatherUserApplicationById)
);

/******************************
 *  Activities
 ******************************/

UserRoute.get(
    '/:user/activities',
    [mustBeAuthenticated, bindUserByParamId('user')],
    wrapAsync(ActivityController.gatherAllUsersActivitiesById)
);

UserRoute.get(
    '/:user/activities/:activity',
    [mustBeAuthenticated, bindUserByParamId('user')],
    wrapAsync(ActivityController.gatherUserActivityById)
);

/******************************
 *  Activities
 ******************************/

UserRoute.get(
    '/:user/badges',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bindUserByParamId('user')],
    wrapAsync(BadgeController.gatherUserBadgeById)
);

export { UserRoute };
