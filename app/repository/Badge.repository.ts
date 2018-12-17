import {ALL_BADGES, Badge, User} from "../models";

export class BadgeRepository {

    public static all(): Badge[] {
        return ALL_BADGES;
    }

    public static allWithUserCount(): Promise<any[]> {
        return Badge.createQueryBuilder("badge")
            .loadRelationCountAndMap("badge.userCount", "badge.users")
            .getMany();
    }

    public static async forUser(user: User) {
        return Badge.createQueryBuilder("badge")
            .leftJoinAndSelect("badge.users", "user")
            .where("user.id = :id", {id: user.id})
            .getMany();
    }
}
