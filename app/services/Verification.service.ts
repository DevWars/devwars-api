import { getManager, getCustomRepository } from 'typeorm';
import EmailVerification from '../models/EmailVerification';
import User from '../models/User';
import { UserRole } from '../models/User';

import { randomString } from '../utils/random';
import { sendWelcomeEmail } from './Mail.service';

import EmailVerificationRepository from '../repository/EmailVerification.repository';

export class VerificationService {
    /**
     * Generates a new random verification token that is stored in the database with the user
     * getting a verification link sent. Verification token will be removed once the user clicks the
     * validation link, inturn calling into the verify endpoint.
     * @param user The user who is getting their verification progress reset.
     */
    public static async reset(user: User) {
        const emailRepository = getCustomRepository(EmailVerificationRepository);
        await emailRepository.removeForUser(user);

        user.role = UserRole.PENDING;

        const verification = new EmailVerification();
        verification.token = randomString(256);
        verification.user = user;

        const verificationUrl = `${process.env.API_URL}/auth/verify?token=${verification.token}`;

        await getManager().transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.save(user);
            await transactionalEntityManager.save(verification);
        });

        await sendWelcomeEmail(user, verificationUrl);
    }
}
