import * as bcrypt from 'bcrypt';
import * as faker from 'faker';
import User, { UserRole } from '../models/user.model';
import { UserProfileSeeding, UserStatsSeeding, UserGameStatsSeeding } from '.';
import EmailOptInSeeding from './emailOptIn.seeding';

export default class UserSeeding {
    public static default(): User {
        const userCard = faker.helpers.userCard();

        const role = faker.random.arrayElement([UserRole.PENDING, UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER]);
        const user = new User(userCard.username, bcrypt.hashSync('secret', 1), userCard.email, role);

        // user.avatarUrl = random.image();
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

    /**
     * Creates a default user with the provided email (this will be forced to lowercase)
     * @param email The email of the default user.
     */
    public static withEmail(email: string): User {
        return Object.assign(this.default(), {
            email,
        });
    }

    public static withRole(role: UserRole) {
        const user = this.default();

        user.role = role;
        return user;
    }

    public static withComponents(username: string = null, email: string = null, role: UserRole = null) {
        return {
            save: async (): Promise<User> => {
                const user = UserSeeding.default();

                if (username != null) user.username = username;
                if (email != null) user.email = email;
                if (role != null) user.role = role;

                const profile = UserProfileSeeding.default();
                const emailOptIn = EmailOptInSeeding.default();
                const stats = UserStatsSeeding.default();
                const gameStats = UserGameStatsSeeding.default();

                await user.save();

                profile.user = user;
                stats.user = user;
                gameStats.user = user;
                emailOptIn.user = user;

                await profile.save();
                await stats.save();
                await gameStats.save();
                await emailOptIn.save();

                return user;
            },
        };
    }
}
