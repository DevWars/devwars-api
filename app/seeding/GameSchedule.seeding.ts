import { date, hacker, helpers, random, lorem } from 'faker';

import GameSchedule from '../models/GameSchedule';
import { GameStatus } from '../models/GameSchedule';
import Game, { GameMode } from '../models/Game';
import { GameObjective } from '../types/common';

export default class GameScheduleSeeding {
    /**
     * Returns a creation of the default game schedule seeding builder.
     */
    public static default(): GameScheduleSeeding {
        return new GameScheduleSeeding();
    }

    /**
     * Creates a object of objectives that match the expected state.
     * @param num The number of objectives to be created.
     */
    private static createObjectives(num: number): { [index: string]: GameObjective } {
        const objectives: { [index: string]: GameObjective } = {};

        for (let index = 0; index < num; index++) {
            objectives[index] = {
                description: lorem.sentence(),
                isBonus: index === num,
                id: index,
            };
        }

        return objectives;
    }

    /**
     * The game schedule that the seeder is creating, this is what the builder
     * object will use to construct the seeded game schedule.
     */
    public gameSchedule: GameSchedule;

    public constructor() {
        const status = helpers.randomize([GameStatus.SCHEDULED, GameStatus.ACTIVE, GameStatus.ENDED]);
        const objectives = GameScheduleSeeding.createObjectives(random.number({ min: 3, max: 5 }));
        const startTime = helpers.randomize([date.past(), date.future()]);
        const mode = helpers.randomize(Object.values(GameMode));

        const setup = {
            title: hacker.noun(),
            templates: {},
            objectives,
            season: 3,
            mode,
        };

        this.gameSchedule = new GameSchedule(startTime, status, setup);
        return this;
    }

    /**
     * Binds the current default game schedule with the given status.
     * @param status The status the given game will have.
     */
    public withStatus(status: GameStatus): GameScheduleSeeding {
        this.gameSchedule.status = status;
        return this;
    }

    /**
     * Binds the current default game schedule with the given schedule.
     * @param game The status the given game will have.
     */
    public withGame(game: Game): GameScheduleSeeding {
        this.gameSchedule.game = game;
        return this;
    }

    /**
     * Binds the current default game schedule with the given start time.
     * @param time The start time the game will have.
     */
    public withStartTime(time: Date): GameScheduleSeeding {
        this.gameSchedule.startTime = time;
        return this;
    }

    /**
     * Creates the given schedule in the database and returns the given game
     * after it has been created.
     */
    public async save(): Promise<GameSchedule> {
        return await this.gameSchedule.save();
    }
}
