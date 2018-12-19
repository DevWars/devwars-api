import {getConnection} from "typeorm";

import {Game, Objective} from "../models";

export class ObjectiveService {
    public static async clearForGame(game: Game) {
        await Objective.createQueryBuilder().where({game_id: game.id}).delete().execute();
    }

    public static async replaceForGame(game: Game, objectives: Objective[]) {
        await getConnection().transaction(async (transaction) => {
            const toDelete = game.objectives.filter((objective) => {
                return !objectives.some((it) => it.number === objective.number);
            });

            await transaction.remove(toDelete);

            for (const newObjective of objectives) {
                const found = game.objectives.find((it) => it.number === newObjective.number) || new Objective();

                found.game = game;
                found.number = newObjective.number;
                found.description = newObjective.description;
                found.bonus = newObjective.bonus;

                await transaction.save(found);
            }
        });
    }
}
