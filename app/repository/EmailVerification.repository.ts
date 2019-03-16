import {EmailVerification, User} from '../models';

export class EmailVerificationRepository {
    public static forUser(user: User): Promise<EmailVerification[]> {
        return EmailVerification.find({where: {user}});
    }
}
