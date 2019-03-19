import User from '../models/User';
import EmailVerification from '../models/EmailVerification';

export class EmailVerificationRepository {
    public static forUser(user: User): Promise<EmailVerification[]> {
        return EmailVerification.find({ where: { user } });
    }
}
