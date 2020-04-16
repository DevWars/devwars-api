import * as express from 'express';
import * as multer from 'multer';

import * as UserController from '../controllers/user/User.controller';
import * as UserProfileController from '../controllers/user/UserProfile.controller';
import * as UserStatsController from '../controllers/user/UserStats.controller';
import * as UserGameStatsController from '../controllers/user/UserGameStats.controller';
import * as LinkedAccountController from '../controllers/user/LinkedAccount.controller';
import * as UserAvatarController from '../controllers/user/UserAvatar.controller';
import * as EmailController from '../controllers/Email.controller';
import { UserRole } from '../models/User';

import { mustBeMinimumRole, mustBeAuthenticated, mustBeRoleOrOwner } from '../middleware/Auth.middleware';
import { statsSchema, profileSchema, updateUserSchema } from './validators/user.validator';
import { bindUserFromUserParam } from '../middleware/User.middleware';
import { emailPermissionSchema } from './validators/email.validator';
import { bodyValidation } from './validators';
import { wrapAsync } from './handlers';

const upload = multer({ dest: 'uploads/' });
const UserRoute: express.Router = express.Router();

/******************************
 *  GENERAL
 ******************************/

UserRoute.get('/', [mustBeAuthenticated, mustBeMinimumRole(UserRole.MODERATOR)], wrapAsync(UserController.all));
UserRoute.get('/leaderboards', wrapAsync(UserController.getUsersLeaderboards));

UserRoute.get('/:user', [bindUserFromUserParam], wrapAsync(UserController.show));

UserRoute.put(
    '/:user',
    [
        mustBeAuthenticated,
        mustBeRoleOrOwner(UserRole.MODERATOR),
        bindUserFromUserParam,
        bodyValidation(updateUserSchema),
    ],
    wrapAsync(UserController.update)
);

UserRoute.delete(
    '/:user',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.ADMIN), bindUserFromUserParam],
    wrapAsync(UserController.deleteUser)
);

UserRoute.put(
    '/:user/avatar',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bindUserFromUserParam, upload.single('avatar')],
    wrapAsync(UserAvatarController.store)
);

/******************************
 *  STATS
 ******************************/

UserRoute.get('/:user/stats', [bindUserFromUserParam], wrapAsync(UserStatsController.forUser));

UserRoute.post(
    '/:user/stats',
    [bodyValidation(statsSchema), bindUserFromUserParam],
    wrapAsync(UserStatsController.create)
);

UserRoute.get('/stats/coins', wrapAsync(UserStatsController.getCoins));
UserRoute.get('/:user/stats/game', [bindUserFromUserParam], wrapAsync(UserGameStatsController.forUser));

/******************************
 *  PROFILE
 ******************************/

UserRoute.get(
    '/:user/profile',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bindUserFromUserParam],
    wrapAsync(UserProfileController.show)
);

UserRoute.patch(
    '/:user/profile',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.ADMIN), bodyValidation(profileSchema), bindUserFromUserParam],
    wrapAsync(UserProfileController.update)
);

/******************************
 *  EMAIL
 ******************************/

UserRoute.get(
    '/:user/emails/permissions',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.ADMIN), bindUserFromUserParam],
    wrapAsync(EmailController.gatherEmailPermissions)
);

UserRoute.patch(
    '/:user/emails/permissions',
    [
        mustBeAuthenticated,
        mustBeRoleOrOwner(UserRole.ADMIN),
        bindUserFromUserParam,
        bodyValidation(emailPermissionSchema),
    ],
    wrapAsync(EmailController.updateEmailPermissions)
);

/******************************
 *  Linked Accounts
 ******************************/

UserRoute.get(
    '/:user/connections',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bindUserFromUserParam],
    wrapAsync(LinkedAccountController.gatherAllUserConnections)
);
UserRoute.get(
    '/:user/connections/:provider',
    [mustBeAuthenticated, mustBeRoleOrOwner(UserRole.MODERATOR), bindUserFromUserParam],
    wrapAsync(LinkedAccountController.gatherAllUserConnectionsByProvider)
);

export { UserRoute };
