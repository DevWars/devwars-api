import { date, hacker, helpers, random, lorem } from 'faker';

import GameSchedule from '../models/GameSchedule';
import { GameStatus } from '../models/GameSchedule';
import { IObjective } from '../factory/Game.factory';

export default class GameScheduleFactory {
    public static default(): GameSchedule {
        const schedule = new GameSchedule();

        const objectives = GameScheduleFactory.createObjectives(random.number({ min: 3, max: 5 }));
        const toIdMap = (result: any, obj: { id: number }) => {
            result[obj.id] = obj;
            return result;
        };

        schedule.startTime = helpers.randomize([date.past(), date.future()]);
        schedule.status = helpers.randomize([GameStatus.SCHEDULED, GameStatus.ENDED]);
        schedule.setup = {
            mode: helpers.randomize(['Classic', 'Zen Garden', 'Blitz']),
            title: hacker.noun(),
            objectives: objectives.reduce(toIdMap, {}),
        };

        return schedule;
    }

    public static upcoming(): GameSchedule {
        const schedule = this.default();

        schedule.startTime = date.future();
        schedule.status = GameStatus.SCHEDULED;

        return schedule;
    }

    public static withStatus(status: GameStatus): GameSchedule {
        const schedule = this.default();
        schedule.status = status;

        return schedule;
    }

    public static withTime(time: Date): GameSchedule {
        const game = this.default();
        game.startTime = time;

        return game;
    }

    public static createObjectives(num: number): IObjective[] {
        const objectives = [];
        for (let id = 1; id <= num; id++) {
            objectives.push({
                id,
                description: lorem.sentence(),
                isBonus: id === num,
            });
        }

        return objectives;
    }
}
