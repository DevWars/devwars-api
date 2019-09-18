import { getManager } from 'typeorm';
import EmailVerification from '../models/EmailVerification';
import User from '../models/User';
import { UserRole } from '../models/User';

import { randomCryptoString } from '../utils/random';
import { sendWelcomeEmail } from './Mail.service';

export class VerificationService {
    /**
     * Generates a new random verification token that is stored in the database with the user
     * getting a verification link sent. Verification token will be removed once the user clicks the
     * validation link, inturn calling into the verify endpoint.
     * @param user The user whois getting there verification progresss reset.
     */
    public static async reset(user: User) {
        user.role = UserRole.PENDING;

        const verification = new EmailVerification();
        verification.token = randomCryptoString();
        verification.user = user;

        const verificationUrl = `${process.env.FRONT_URL}/auth/verify?token=${verification.token}`;

        await getManager().transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.save(user);
            await transactionalEntityManager.save(verification);
        });

        await sendWelcomeEmail(user, verificationUrl);
    }
}
