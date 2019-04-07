import EmailVerification from '../models/EmailVerification';
import User from '../models/User';

export default class EmailVerifiCationFactory {
    public static default(): EmailVerification {
        const emailVerif = new EmailVerification();
        emailVerif.token = "secret";

        return emailVerif;
    }

    public static withUser(user: User): EmailVerification {
        const emailVerif = this.default();

        emailVerif.user = user;

        return emailVerif;
    }
}