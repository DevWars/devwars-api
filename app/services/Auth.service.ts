import { hash } from '../utils/hash';

import PasswordReset from '../models/PasswordReset';
import User from '../models/User';
import { UserRole } from '../models/User';

import IRegistrationRequest from '../request/RegistrationRequest';
import { randomString } from '../utils/random';
import { MailService } from './Mail.service';
import { VerificationService } from './Verification.service';

export class AuthService {
    public static async register(request: IRegistrationRequest) {
        const user = new User();

        user.email = request.email;
        user.username = request.username;
        user.password = await hash(request.password);
        user.role = UserRole.PENDING;
        user.lastSignIn = new Date();

        await VerificationService.reset(user);

        return user.save();
    }

    public static async newToken(user: User): Promise<string> {
        user.token = randomString(32);

        await user.save();

        return user.token;
    }

    public static async resetPassword() {
        const reset = await new PasswordReset().save();

        // await MailService.send([user.email], 'reset-password', {
        //     url: `${process.env.FRONT_URL}/reset-password?key=${reset.token}`,
        //     username: user.username,
        // });
    }
}
