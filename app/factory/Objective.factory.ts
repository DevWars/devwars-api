import {lorem, random} from 'faker';

import {Game, Objective} from '../models';

export class ObjectiveFactory {
    public static default(): Objective {
        const objective = new Objective();

        Object.assign(objective, {
            bonus: false,
            createdAt: new Date(),
            description: lorem.sentence(5),
            number: 1,
            startTime: new Date(),
            updatedAt: new Date(),
        });

        return objective;
    }

    public static withGame(game: Game): Objective {
        const objective = this.default();

        objective.game = game;

        return objective;
    }

    public static defaultObjectivesForGame(game: Game, count?: number): Objective[] {
        const objectives: Objective[] = [];

        if (!count) {
            count = random.number({min: 2, max: 5});
        }

        for (let i = 0; i < count; i++) {
            const objective = this.withGame(game);

            objective.number = i + 1;

            objectives.push(objective);
        }

        return objectives;
    }
}
