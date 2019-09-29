import { Repository, EntityRepository } from 'typeorm';

import User from '../models/User';
import EmailVerification from '../models/EmailVerification';
import * as _ from 'lodash';

@EntityRepository(EmailVerification)
export default class EmailVerificationRepository extends Repository<EmailVerification> {
    /**
     * Deletes the existing email verification token if it exists for the user.
     * @param user THe user whos email verification will be removed.
     */
    public async removeForUser(user: User) {
        // if the given user object has the verification link directly, go and remove it and return
        // out, otherwise we will continue to attempt to find and locate it.
        if (!_.isNil(user.verification)) return await EmailVerification.delete(user.verification);

        const emailVerification = await EmailVerification.findOne({ where: { user } });

        // if the user does not already have a email verification token, just return early as if the
        // action was performed fully as expected.
        if (_.isNil(emailVerification)) return;

        // delete the email verificaion for the user.
        await emailVerification.remove();
    }
    public forUser(user: User): Promise<EmailVerification[]> {
        return EmailVerification.find({ where: { user } });
    }
}
