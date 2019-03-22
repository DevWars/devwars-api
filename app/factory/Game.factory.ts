import { hacker, helpers, internet, random, lorem } from 'faker';

import Game from '../models/Game';

interface IObjective {
    id: number;
    description: string;
    isBonus: boolean;
}

export default class GameFactory {
    public static default() {
        const game = new Game();

        const objectives = GameFactory.createObjectives(random.number({ min: 3, max: 5 }));

        const toIdMap = (result: any, obj: { id: number }) => {
            result[obj.id] = obj;
            return result;
        };

        const addRandomObjectiveState = (result: any, obj: { id: number }) => {
            result[obj.id] = helpers.randomize(['incomplete', 'complete']);
            return result;
        };

        game.season = random.number({ min: 1, max: 3 });
        game.mode = helpers.randomize(['Classic', 'Zen Garden', 'Blitz']);
        game.videoUrl = internet.url();
        game.storage = {
            mode: game.mode,
            title: hacker.noun(),
            objectives: objectives.reduce(toIdMap, {}),
            players: GameFactory.createPlayers(6),
            editors: GameFactory.createEditors(6),
            teams: {
                0: {
                    id: 0,
                    name: 'blue',
                    objectives: objectives.reduce(addRandomObjectiveState, {}),
                    votes: {
                        ui: random.number({ min: 0, max: 100 }),
                        ux: random.number({ min: 0, max: 100 }),
                        tie: random.number({ min: 0, max: 100 }),
                    },
                },
                1: {
                    id: 1,
                    name: 'red',
                    objectives: objectives.reduce(addRandomObjectiveState, {}),
                    votes: {
                        ui: random.number({ min: 0, max: 100 }),
                        ux: random.number({ min: 0, max: 100 }),
                        tie: random.number({ min: 0, max: 100 }),
                    },
                },
            },
            meta: {},
        };

        game.storage.meta = {
            winningTeam: random.number({ max: 1 }),
            teamScores: {
                0: {
                    objectives: random.number({ min: 0, max: 5 }),
                    ui: random.number({ min: 0, max: 2 }),
                    ux: random.number({ min: 0, max: 2 }),
                    tie: random.number({ min: 0, max: 1 }),
                },
                1: {
                    objectives: random.number({ min: 0, max: 5 }),
                    ui: random.number({ min: 0, max: 2 }),
                    ux: random.number({ min: 0, max: 2 }),
                    tie: random.number({ min: 0, max: 1 }),
                },
            },
        };

        return game;
    }

    public static createObjectives(num: number): IObjective[] {
        const objectives = [];
        for (let id = 0; id < num; id++) {
            objectives.push({
                id,
                description: lorem.sentence(),
                isBonus: id === num - 1,
            });
        }

        return objectives;
    }

    public static createPlayers(num: number) {
        const players: any = {};
        for (let id = 0; id < num; id++) {
            players[id] = {
                id,
                username: helpers.userCard().username,
                team: id < num / 2 ? 0 : 1,
            };
        }

        return players;
    }

    public static createEditors(num: number) {
        const editors: any = {};
        const languages: any = { 0: 'html', 1: 'css', 2: 'js' };

        for (let id = 0; id < num; id++) {
            editors[id] = {
                id,
                player: id,
                language: id > 2 ? languages[id - 3] : languages[id],
                template: '',
            };
        }

        return editors;
    }
}
