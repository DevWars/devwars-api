import {EmailVerification, User, UserRole} from "../models";
import {randomString} from "../utils/random";
import {MailService} from "./Mail.service";

export class VerificationService {

    public static async reset(user: User) {
        user.role = UserRole.PENDING;

        await user.save();

        const verification = new EmailVerification();
        verification.user = user;
        verification.token = randomString(64);

        await verification.save();

        const url = `${process.env.ROOT_URL}/auth/verify?key=${verification.token}`;

        await MailService.send([user.email], "welcome", {url});
    }

   public static async newToken(user: User): Promise<string> {
        user.token = randomString(32);

        await user.save();

        return user.token;
    }

}
