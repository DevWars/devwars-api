import { getManager } from 'typeorm';
import { hash } from '../utils/hash';
import { addHours } from 'date-fns';

import PasswordReset from '../models/PasswordReset';
import User from '../models/User';
import { UserRole } from '../models/User';
import UserProfile from '../models/UserProfile';
import UserStats from '../models/UserStats';
import UserGameStats from '../models/UserGameStats';

import IRegistrationRequest from '../request/RegistrationRequest';
import { randomCryptoString } from '../utils/random';
import { sendPasswordResetEmail } from './Mail.service';
import { VerificationService } from './Verification.service';

import * as jwt from 'jsonwebtoken';

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
        profile.skills = { html: 1, css: 1, js: 1 };

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

    /**
     * Generates a new JWT token that will be used for the authorization of the user.
     * @param user The user who is getting the new token.
     */
    public static async newToken(user: User): Promise<string> {
        user.token = jwt.sign({ id: user.id }, 'secret');
        await user.save();
        return user.token;
    }

    /**
     * Verifies a given authentication token, if the token fails to verify, then it will be thrown,
     * otherwise will return a decoded object. That will contain the database id of the given user.
     * @param token The token that is being verified.
     */
    public static VerifyAuthenticationToken(token: string): { id: string } | null {
        try {
            return jwt.verify(token, 'seceret') as { id: string };
        } catch (error) {
            return null;
        }
    }

    public static async resetPassword(user: User) {
        const reset = await new PasswordReset();
        reset.expiresAt = addHours(new Date(), 6);
        reset.token = randomCryptoString();
        reset.user = user;

        const resetUrl = `${process.env.FRONT_URL}/reset-password?token=${reset.token}`;

        await reset.save();

        await sendPasswordResetEmail(user, resetUrl);
    }
}
