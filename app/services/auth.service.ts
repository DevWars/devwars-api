import * as jwt from 'jsonwebtoken';
import { getManager } from 'typeorm';
import { hash } from '../utils/hash';
import { addHours } from 'date-fns';
import { nanoid } from 'nanoid';

import PasswordReset from '../models/passwordReset.model';
import UserGameStats from '../models/userGameStats.model';
import User, { UserRole } from '../models/user.model';
import UserProfile from '../models/userProfile.model';
import EmailOptIn from '../models/emailOptIn.model';
import UserStats from '../models/userStats.model';

import RegistrationRequest from '../request/registrationRequest';

import { VerificationService } from './verification.service';
import { sendPasswordResetEmail } from './mail.service';

export class AuthService {
    public static async register(request: RegistrationRequest, shouldSendVerification = true) {
        const { username, email, password } = request;

        let user = new User(username, await hash(password), email, UserRole.PENDING);
        user.lastSignIn = new Date();

        await getManager().transaction(async (transactionalEntityManager) => {
            user = await transactionalEntityManager.save(user);

            const profile = new UserProfile(user);
            profile.skills = { html: 1, css: 1, js: 1 };
            const userStats = new UserStats(user);
            const gameStats = new UserGameStats(user);
            const emailOptIn = new EmailOptIn(user);

            await transactionalEntityManager.save(profile);
            await transactionalEntityManager.save(userStats);
            await transactionalEntityManager.save(gameStats);
            await transactionalEntityManager.save(emailOptIn);
        });

        // Only email if specified (is by default)
        if (shouldSendVerification) await VerificationService.reset(user);

        return user;
    }

    /**
     * Generates a new JWT token that will be used for the authorization of the user.
     * @param user The user who is getting the new token.
     */
    public static async newToken(user: User, expiresIn: string | number = '7d'): Promise<string> {
        user.token = jwt.sign({ id: user.id }, process.env.AUTH_SECRET, { expiresIn });
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
            return jwt.verify(token, process.env.AUTH_SECRET) as { id: string };
        } catch (error) {
            return null;
        }
    }

    /**
     * Generates a reset token for the user to reset there given password, sending a new reset
     * email. They have 6 hours from the current server time to change the password.
     * @param user The user of the password being reset.
     */
    public static async resetPassword(user: User) {
        const reset = new PasswordReset(user, nanoid(64), addHours(new Date(), 6));
        const resetUrl = `${process.env.FRONT_URL}/reset-password?token=${reset.token}`;

        await reset.save();

        await sendPasswordResetEmail(user, resetUrl);
    }
}
