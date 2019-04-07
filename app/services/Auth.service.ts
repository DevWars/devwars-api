import { getManager } from 'typeorm';
import { hash } from '../utils/hash';

import PasswordReset from '../models/PasswordReset';
import User from '../models/User';
import { UserRole } from '../models/User';
import UserProfile from '../models/UserProfile';
import UserStats from '../models/UserStats';
import UserGameStats from '../models/UserGameStats';

import IRegistrationRequest from '../request/RegistrationRequest';
import { randomString } from '../utils/random';
import { MailService } from './Mail.service';
import { VerificationService } from './Verification.service';

export class AuthService {
    public static async register(request: IRegistrationRequest) {
        const user = new User();
        user.email = request.email;
        user.username = request.username;
        user.password = await hash(request.password);
        user.role = UserRole.PENDING;
        user.lastSignIn = new Date();

        const profile = new UserProfile();
        profile.user = user;

        const userStats = new UserStats();
        userStats.user = user;

        const gameStats = new UserGameStats();
        gameStats.user = user;

        await VerificationService.reset(user);

        await getManager().transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.save(user);
            await transactionalEntityManager.save(profile);
            await transactionalEntityManager.save(userStats);
            await transactionalEntityManager.save(gameStats);
        });

        return user;
    }

    public static async newToken(user: User): Promise<string> {
        user.token = randomString(32);

        await user.save();

        return user.token;
    }

    public static async resetPassword(user: User) {
        const reset = await new PasswordReset().save();

        await MailService.send([user.email], 'reset-password', {
            url: `${process.env.FRONT_URL}/reset-password?key=${reset.token}`,
            username: user.username,
        });
    }
}
