import { hacker, helpers, internet, random, lorem } from 'faker';

import Game from '../models/Game';
import { GameStatus } from '../models/GameSchedule';
import User from '../models/User';

export interface IObjective {
    id: number;
    description: string;
    isBonus: boolean;
}

export default class GameFactory {
    public static async default() {
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

        const players = await GameFactory.createPlayers(6);

        // TEMPORARY: Remove once Editor refactor is completed
        game.status = helpers.randomize([GameStatus.SCHEDULED, GameStatus.ENDED]);

        game.season = random.number({ min: 1, max: 3 });
        game.mode = helpers.randomize(['Classic', 'Zen Garden', 'Blitz']);
        game.videoUrl = helpers.randomize([null, internet.url()]);
        game.storage = {
            mode: game.mode,
            title: hacker.noun(),
            objectives: objectives.reduce(toIdMap, {}),
            players,
            editors: GameFactory.createEditors(6, Object.values(players)),
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

    public static async withMode(mode: string) {
        const game = await GameFactory.default();

        game.mode = mode;

        return game;
    }

    public static async withSeason(season: number) {
        const game = await GameFactory.default();
        game.season = season;
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

    public static async createPlayers(num: number) {
        const players: any = {};
        const users = await User.find();

        for (let i = 1; i <= num; i++) {
            const randomUserIndex = random.number({ min: 0, max: users.length - 1 });
            const user = users[randomUserIndex];

            players[user.id] = {
                id: user.id,
                username: user.username,
                team: i <= num / 2 ? 0 : 1,
            };
        }

        return players;
    }

    public static createEditors(num: number, players: any[]) {
        const editors: any[] = [
            { id: 0, team: 0, language: 'html' },
            { id: 1, team: 0, language: 'css' },
            { id: 2, team: 0, language: 'js' },

            { id: 3, team: 1, language: 'html' },
            { id: 4, team: 1, language: 'css' },
            { id: 5, team: 1, language: 'js' },
        ];

        const result: any = {};
        for (const player of players) {
            const editor = editors.shift();
            if (!editor) break;

            editor.player = player.id;
            // Override player.team with editor.team
            player.team = editor.team;
            result[editor.id] = editor;
        }

        return result;
    }
}
