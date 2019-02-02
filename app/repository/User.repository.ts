import {Game, GameApplication, User} from "../models";

interface ICredentials {
    identifier: string;
}

export class UserRepository {

    public static async userForCredentials(request: ICredentials): Promise<User> {
        const byEmail = await UserRepository.byEmail(request.identifier);

        if (byEmail) {
            return byEmail;
        }

        const byUsername = await UserRepository.byUsername(request.identifier);

        if (byUsername) {
            return byUsername;
        }

        return undefined;
    }

    public static async userForToken(token: string): Promise<User> {
        return User.createQueryBuilder().where({token}).getOne();
    }

    public static byEmail(email: string): Promise<User> {
        return User.createQueryBuilder().where("LOWER(email) = LOWER(:email)", {email}).getOne();
    }

    public static byUsername(username: string): Promise<User> {
        return User.createQueryBuilder().where("LOWER(username) = LOWER(:username)", {username}).getOne();
    }

    public static byId(id: number): Promise<User> {
        return User.findOne(id);
    }

    public static async byAppliedGame(game: Game): Promise<User[]> {
        return User.createQueryBuilder("user")
            .where((qb) => {
                const subQuery = qb.subQuery()
                    .select("application.user_id")
                    .from(GameApplication, "application")
                    .where("application.game_id = :game")
                    .getSql();

                return "user.id in " + subQuery;
            })
            .setParameter("game", game.id)
            .getMany();
    }
}
