import * as express from 'express';
import * as multer from 'multer';

import * as UserController from '../controllers/user/User.controller';
import * as UserProfileController from '../controllers/user/UserProfile.controller';
import * as UserStatsController from '../controllers/user/UserStats.controller';
import * as UserGameStatsController from '../controllers/user/UserGameStats.controller';
import * as UserAvatarController from '../controllers/user/UserAvatar.controller';
import * as EmailController from '../controllers/Email.controller';

import { UserRole } from '../models/User';
import { mustBeRole, mustBeAuthenticated, mustBeRoleOrOwner } from '../middleware/Auth.middleware';
import { asyncErrorHandler } from './handlers';
import { bodyValidation } from './validators';
import { statsSchema, profileSchema, updateUserSchema } from './validators/user.validator';
import { bindUserFromUserParam } from '../middleware/User.middleware';
import { emailPermissionSchema } from './validators/email.validator';

const upload = multer({ dest: 'uploads/' });
const UserRoute: express.Router = express.Router();

/******************************
 *  GENERAL
 ******************************/

UserRoute.get('/', [mustBeAuthenticated, mustBeRole(UserRole.ADMIN)], asyncErrorHandler(UserController.all));

UserRoute.get(
    '/lookup',
    [mustBeAuthenticated, mustBeRole(UserRole.MODERATOR)],
    asyncErrorHandler(UserController.lookupUser)
);

UserRoute.get('/:user', [bindUserFromUserParam], asyncErrorHandler(UserController.show));

UserRoute.put(
    '/:user',
    [
        mustBeAuthenticated,
        mustBeRoleOrOwner(UserRole.MODERATOR),
        bindUserFromUserParam,
        bodyValidation(updateUserSchema),
    ],
    asyncErrorHandler(UserController.update)
);
UserRoute.put(
    '/:user/avatar',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bindUserFromUserParam, upload.single('avatar')],
    asyncErrorHandler(UserAvatarController.store)
);

/******************************
 *  STATS
 ******************************/

UserRoute.get('/:user/stats', [bindUserFromUserParam], asyncErrorHandler(UserStatsController.forUser));

UserRoute.post(
    '/:user/stats',
    [bodyValidation(statsSchema), bindUserFromUserParam],
    asyncErrorHandler(UserStatsController.create)
);

UserRoute.get('/stats/coins', asyncErrorHandler(UserStatsController.getCoins));
UserRoute.get('/:user/stats/game', [bindUserFromUserParam], asyncErrorHandler(UserGameStatsController.forUser));

/******************************
 *  PROFILE
 ******************************/

UserRoute.get(
    '/:user/profile',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bindUserFromUserParam],
    asyncErrorHandler(UserProfileController.show)
);

UserRoute.patch(
    '/:user/profile',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.ADMIN), bodyValidation(profileSchema), bindUserFromUserParam],
    asyncErrorHandler(UserProfileController.update)
);

/******************************
 *  EMAIL
 ******************************/

UserRoute.get(
    '/:user/emails/permissions',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.ADMIN), bindUserFromUserParam],
    asyncErrorHandler(EmailController.gatherEmailPermissions)
);

UserRoute.patch(
    '/:user/emails/permissions',
    [
        mustBeAuthenticated,
        mustBeRoleOrOwner(UserRole.ADMIN),
        bindUserFromUserParam,
        bodyValidation(emailPermissionSchema),
    ],
    asyncErrorHandler(EmailController.updateEmailPermissions)
);

export { UserRoute };
