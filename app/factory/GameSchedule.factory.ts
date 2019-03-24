import { date, hacker, helpers, random, lorem } from 'faker';

import GameSchedule from '../models/GameSchedule';
import { GameStatus } from '../models/GameSchedule';

export default class GameScheduleFactory {
    public static default(): GameSchedule {
        const schedule = new GameSchedule();

        schedule.startTime = helpers.randomize([date.past(), date.future()]);
        schedule.status = helpers.randomize([GameStatus.SCHEDULED, GameStatus.ACTIVE, GameStatus.ENDED]);
        schedule.setup = {
            mode: helpers.randomize(['Classic', 'Zen Garden', 'Blitz']),
            title: hacker.noun(),
            objectives: {
                0: {
                    description: lorem.sentence(),
                    isBonus: random.boolean(),
                },
                1: {
                    description: lorem.sentence(),
                    isBonus: random.boolean(),
                },
            },
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
}
