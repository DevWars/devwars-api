import { getManager, getCustomRepository } from 'typeorm';
import { nanoid } from 'nanoid';
import EmailVerification from '../models/emailVerification.model';
import User, { UserRole } from '../models/user.model';

import logger from '../utils/logger';
import { sendWelcomeEmail } from './mail.service';

import EmailVerificationRepository from '../repository/emailVerification.repository';

export class VerificationService {
    /**
     * Generates a new random verification token that is stored in the database with the user
     * getting a verification link sent. Verification token will be removed once the user clicks the
     * validation link, inturn calling into the verify endpoint.
     * @param user The user who is getting their verification progress reset.
     */
    public static async reset(user: User) {
        // If the given user is moderator or a admin, they should not be subject to updating user
        // role state. e.g only standard users have to go through email verification again.
        if (user.isStaff()) return;

        const emailRepository = getCustomRepository(EmailVerificationRepository);
        await emailRepository.removeForUser(user);

        user.role = UserRole.PENDING;

        const verification = new EmailVerification();
        verification.token = nanoid(64);
        verification.user = user;

        const verificationUrl = `${process.env.API_URL}/auth/verify?token=${verification.token}`;

        await getManager().transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.save(verification);
            await transactionalEntityManager.save(user);
        });

        // Log verification urls in production in case email service fails.
        if (process.env.NODE_ENV === 'production') {
            logger.info(`USER REGISTRATION: name: "${user.username}" email: "${user.email}" verificationUrl: "${verificationUrl}"`);
        }

        await sendWelcomeEmail(user, verificationUrl);
    }
}
