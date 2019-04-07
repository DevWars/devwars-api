import { getManager } from 'typeorm';
import EmailVerification from '../models/EmailVerification';
import User from '../models/User';
import { UserRole } from '../models/User';

import { randomString } from '../utils/random';
import { sendWelcomeEmail } from './Mail.service';

export class VerificationService {
    public static async reset(user: User) {
        user.role = UserRole.PENDING;

        const verification = new EmailVerification();
        verification.user = user;
        verification.token = randomString(64);

        const verificationUrl = `${process.env.FRONT_URL}/auth/verify?key=${verification.token}`;

        await getManager().transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.save(user);
            await transactionalEntityManager.save(verification);
        });

        await sendWelcomeEmail(user, verificationUrl);
    }

    public static async newToken(user: User): Promise<string> {
        user.token = randomString(32);

        await user.save();

        return user.token;
    }
}
