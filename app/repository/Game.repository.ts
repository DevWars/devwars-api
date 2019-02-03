import {Game, GameStatus, User} from "../models";
import {GameApplication} from "../models/GameApplication";

export class GameRepository {

    public static all(): Promise<Game[]> {
        return Game.find({
            order: {
                startTime: "DESC",
            },
        });
    }

    public static latest(): Promise<Game> {
        return Game.findOne({order: {startTime: "DESC"}, relations: ["teams", "objectives"]});
    }

    public static byId(id: number): Promise<Game> {
        return Game.findOne(id, {relations: ["teams", "objectives"]});
    }

    public static bySeason(season: number): Promise<Game[]> {
        return Game.find({where: {season}});
    }

    public static byStatus(status: GameStatus): Promise<Game[]> {
        return Game.find({where: {status}});
    }

    public static async byUserApplication(user: User): Promise<Game[]> {
        return Game.createQueryBuilder("game")
            .where((qb) => {
                const subQuery = qb.subQuery()
                    .select("application.game_id")
                    .from(GameApplication, "application")
                    .where("application.user_id = :user")
                    .getSql();

                return "game.id in " + subQuery;
            })
            .setParameter("user", user.id)
            .getMany();
    }
}
