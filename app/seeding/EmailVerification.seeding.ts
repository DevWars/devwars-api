import EmailVerification from '../models/EmailVerification';
import User from '../models/User';

export default class EmailVerificationSeeding {
    public static default(): EmailVerification {
        const emailVerification = new EmailVerification();
        emailVerification.token = 'secret';

        return emailVerification;
    }

    public static withUser(user: User): EmailVerification {
        const emailVerification = this.default();

        emailVerification.user = user;

        return emailVerification;
    }
}
