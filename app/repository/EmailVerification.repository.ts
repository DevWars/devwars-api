import { Repository, EntityRepository } from 'typeorm';

import User from '../models/user.model';
import EmailVerification from '../models/emailVerification.model';
import * as _ from 'lodash';

@EntityRepository(EmailVerification)
export default class EmailVerificationRepository extends Repository<EmailVerification> {
    /**
     * Deletes the existing email verification token if it exists for the user.
     * @param user The user who is email verification will be removed.
     */
    public async removeForUser(user: User) {
        // If the given user object has the verification link directly, go and remove it and return
        // out, otherwise we will continue to attempt to find and locate it.
        if (!_.isNil(user.verification)) return await this.delete(user.verification);

        const emailVerification = await this.findOne({ where: { user } });

        // If the user does not already have a email verification token, just return early as if the
        // action was performed fully as expected.
        if (_.isNil(emailVerification)) return;

        // Delete the email verification for the user.
        await emailVerification.remove();
    }

    public forUser(user: User): Promise<EmailVerification[]> {
        return this.find({ where: { user } });
    }
}
