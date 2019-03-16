import {getConnection} from 'typeorm';

import {Game, Objective} from '../models';

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
                const found = game.objectives.find((it) => it.number === newObjective.number);

                const objective = {
                    bonus: newObjective.bonus !== null,
                    description: newObjective.description,
                    gameId: game.id,
                    number: newObjective.number,
                };

                if (found) {
                    await transaction.createQueryBuilder().update('objectives')
                        .where('id = :id', {id: found.id})
                        .set(objective)
                        .execute();
                } else {
                    const query = transaction.createQueryBuilder().insert().into('objectives').values(objective);

                    await query.execute();
                }
            }
        });
    }
}
