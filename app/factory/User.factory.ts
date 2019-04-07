import * as bcrypt from 'bcrypt';
import { helpers, random } from 'faker';
import User, { UserRole } from '../models/User';

export default class UserFactory {
    public static default(): User {
        const user = new User();

        user.lastSignIn = new Date();
        user.email = helpers.userCard().email;
        user.username = helpers.userCard().username;
        user.password = bcrypt.hashSync('secret', 1);
        user.role = random.arrayElement([UserRole.PENDING, UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER]);
        user.avatarUrl = random.image();

        return user;
    }

    public static withUsername(username: string): User {
        const user = this.default();

        user.username = username;

        return user;
    }

    public static withRole(role: UserRole) {
        const user = this.default();

        user.role = role;

        return user;
    }
}
