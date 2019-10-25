import User from '../models/User';
import { VerificationService } from './Verification.service';

export class ResetService {
    public static async resetEmail(user: User, email: string) {
        user.email = email;

        await user.save();

        await VerificationService.reset(user);
    }
}
