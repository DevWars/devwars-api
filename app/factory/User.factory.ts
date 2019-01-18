import {helpers, random} from "faker";
import {User, UserRole} from "../models";

export class UserFactory {

    public static default(): User {
        const user = new User();

        user.role = random.arrayElement([UserRole.PENDING, UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER]);
        user.username = helpers.userCard().username;
        user.email = helpers.userCard().email;
        user.avatarUrl = random.image();

        user.statistics = {
            coins: random.number(100000),
            losses: 0,
            wins: 0,
            xp: random.number(22000),
        };

        return user;
    }

    public static withUsername(username: string): User {
        const user = this.default();

        user.username = username;

        return user;
    }

    public static withRole(role: UserRole) {
        const user = UserFactory.default();

        user.role = role;

        return user;
    }
}
