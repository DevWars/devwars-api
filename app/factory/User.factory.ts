import * as bcrypt from 'bcrypt';
import { helpers, random } from 'faker';
import User, { UserRole } from '../models/User';

export default class UserFactory {
    public static default(): User {
        const user = new User();

        user.lastSignIn = new Date();
        user.email = helpers.userCard().email;
        user.username = helpers.userCard().username.toLowerCase();
        user.password = bcrypt.hashSync('secret', 1);
        user.role = random.arrayElement([UserRole.PENDING, UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER]);
        user.avatarUrl = random.image();

        return user;
    }

    /**
     * Creates a default user with the provided username (this will be forced to lowercase)
     * @param username The username of the default user.
     */
    public static withUsername(username: string): User {
        return Object.assign(this.default(), {
            username: username.toLowerCase(),
        });
    }

    public static withRole(role: UserRole) {
        const user = this.default();

        user.role = role;

        return user;
    }
}
