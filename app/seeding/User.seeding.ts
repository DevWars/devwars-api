import * as bcrypt from 'bcrypt';
import { helpers, random } from 'faker';
import User, { UserRole } from '../models/User';

import { USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from '../constants';

export default class UserSeeding {
    public static default(): User {
        const userCard = helpers.userCard();

        const role = random.arrayElement([UserRole.PENDING, UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER]);
        const user = new User(userCard.username, bcrypt.hashSync('secret', 1), userCard.email, role);

        user.avatarUrl = random.image();
        user.lastSignIn = new Date();

        return user;
    }

    /**
     * Creates a default user with the provided username (this will be forced to lowercase)
     * @param username The username of the default user.
     */
    public static withUsername(username: string): User {
        return Object.assign(this.default(), {
            username,
        });
    }

    public static withRole(role: UserRole) {
        const user = this.default();

        user.role = role;
        return user;
    }
}
