import { date, hacker, helpers, internet, lorem, random } from 'faker';
import * as _ from 'lodash';

import Game, { GameMode } from '../models/Game';
import { GameStatus } from '../models/GameSchedule';
import User from '../models/User';

import UserSeeding from './User.seeding';
import { GameScheduleSeeding } from '.';
import { GameStorage } from '../types/game';
import { getCustomRepository } from 'typeorm';
import UserRepository from '../repository/User.repository';
import { GameObjective } from '../types/common';

export default class GameSeeding {
    /**
     * Returns a creation of the default game seeding builder.
     * @param shouldCreateSchedule If it should create a related schedule or not.
     */
    public static default(shouldCreateSchedule = false): GameSeeding {
        return new GameSeeding(shouldCreateSchedule);
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
     * The game that is being created.
     */
    public game: Game;

    /**
     * The seeding object for creating a related game schedule.
     */
    public gameScheduleSeeding: GameScheduleSeeding;

    /**
     * If players have been found or loaded to the game, this will be used for
     * when binding the editors. If no players exist, then players will be added
     * before the editors.
     */
    private playersLoaded = false;

    /**
     * If a related game schedule should be created for the given game.
     */
    private readonly shouldCreateSchedule: boolean;

    /**
     * Create a default seeded game object, that uses the builder method.
     * @param shouldCreateSchedule If it should create a related schedule or not.
     */
    public constructor(shouldCreateSchedule = true) {
        this.shouldCreateSchedule = shouldCreateSchedule;

        const mode = helpers.randomize(Object.values(GameMode));
        const title = hacker.noun() + hacker.noun();
        const videoUrl = helpers.randomize([undefined, internet.url()]);
        const gameStatus = helpers.randomize([GameStatus.ACTIVE, GameStatus.ENDED, GameStatus.SCHEDULED]);
        const startTime = helpers.randomize([date.past(), date.future()]);

        this.game = new Game(3, mode, title, videoUrl, gameStatus, {
            mode,
            title,
            startTime,
            editors: {},
            objectives: GameSeeding.createObjectives(5),
            players: {},
            teams: {
                '0': { id: 0, name: 'blue', objectives: {} },
                '1': { id: 1, name: 'red', objectives: {} },
            },
            templates: {},
            meta: {
                teamScores: [],
                winningTeam: null,
                bets: { blue: 0, red: 0, tie: false },
            },
        });
    }

    /**
     * Adds a template for the given game based on the language.
     * @param language The language of the templates being added.
     */
    public WithTemplate(language: string): GameSeeding {
        switch (language) {
            case 'js':
                this.game.storage.templates[language] = 'console.log("hit")';
                break;
            case 'css':
                this.game.storage.templates[language] = 'body { background: white; }';
                break;
            case 'html':
                this.game.storage.templates[language] = '<html><body>hi</body></html>';
                break;
        }
        return this;
    }

    /**
     * Adds all the supporting templates for the given game.
     */
    public WithTemplates(): GameSeeding {
        for (const language of ['html', 'css', 'js']) this.WithTemplate(language);
        return this;
    }

    /**
     * Marks the given mode on the given game.
     * @param mode The mode the game should be created with.
     */
    public withMode(mode: GameMode): GameSeeding {
        this.game.mode = mode;
        return this;
    }

    /**
     * Adds the given status to the game.
     * @param status The status being added to the game.
     */
    public withStatus(status: GameStatus): GameSeeding {
        this.game.status = status;
        return this;
    }

    /**
     * Adds the given season to the game.
     * @param season The season being added to the game.
     */
    public withSeason(season: number): GameSeeding {
        this.game.season = season;
        return this;
    }

    /**
     * Adds the provided players to the given game.
     * @param players Adds the given players to the given game.
     */
    public withPlayers(players: User[]): GameSeeding {
        for (const player of players) {
            this.game.storage.players[player.id] = {
                id: player.id,
                username: player.username,
                team: player.id % 2 ? 0 : 1,
            };
        }

        this.playersLoaded = true;
        return this;
    }

    /**
     * Includes generated players within the game based the number (amount)
     * provided.
     * @param amount The amount of generated players to be added.
     */
    public async withGeneratedPlayers(amount = 6): Promise<GameSeeding> {
        for (let i = 1; i <= amount; i++) {
            const player = await UserSeeding.default().save();

            this.game.storage.players[player.id] = {
                username: player.username,
                team: i % 2 ? 0 : 1,
                id: player.id,
            };
        }

        this.playersLoaded = true;
        return this;
    }

    /**
     * Includes editors within the game seeding process, this will generate the
     * related users if non exist or none have already been created with the
     * seeder.
     */
    public async withEditors(): Promise<GameSeeding> {
        const editors = [
            { id: 0, team: 0, language: 'html', player: 0 },
            { id: 1, team: 0, language: 'css', player: 0 },
            { id: 2, team: 0, language: 'js', player: 0 },

            { id: 3, team: 1, language: 'html', player: 0 },
            { id: 4, team: 1, language: 'css', player: 0 },
            { id: 5, team: 1, language: 'js', player: 0 },
        ];

        let users: any = [];

        // If we don't have players, but we want a editor, then we need to
        // create players for the given game, only if there does not already
        // exist at least 6 players.
        if (!this.playersLoaded) {
            const userRepository = getCustomRepository(UserRepository);
            users = await userRepository.find({ take: 6 });

            if (users.length < 6) {
                await this.withGeneratedPlayers();
                users = Object.values(this.game.storage.players);
            }
        }

        const result: GameStorage['editors'] = {};
        for (const player of Object.values(this.game.storage.players)) {
            const editor = editors.shift();

            editor.player = player.id;

            // Override player.team with editor.team
            player.team = editor.team;
            result[editor.id] = editor;
        }

        this.game.storage.editors = result;

        return this;
    }

    /**
     * With generated team scores, this includes the teams votes for ui, ux and
     * tie, and the stream meta score results for both teams. This also includes
     * objective totals and tie state.
     */
    public withTeamScores(): GameSeeding {
        const objectivesForTeam = (max: number) => {
            const result: any = {};

            let count = 0;
            _.forEach(this.game.storage.objectives, (o: any) => {
                if (count !== max) {
                    result[o.id] = 'complete';
                    count += 1;
                } else {
                    result[o.id] = 'incomplete';
                }
            });

            return result;
        };

        this.game.storage.teams[0].votes = {
            ui: random.number({ min: 0, max: 100 }),
            ux: random.number({ min: 0, max: 100 }),
            tie: random.boolean(),
        };

        this.game.storage.teams[1].votes = {
            ui: random.number({ min: 0, max: 100 }),
            ux: random.number({ min: 0, max: 100 }),
            tie: random.boolean(),
        };

        this.game.storage.meta.winningTeam = random.number({ max: 1 });
        const numberOfObjectives = _.size(this.game.storage.objectives);

        const teamOneObjectives = random.number({ min: 0, max: numberOfObjectives });
        const teamTwoObjectives = random.number({ min: 0, max: numberOfObjectives });

        this.game.storage.teams[0].objectives = objectivesForTeam(teamOneObjectives);
        this.game.storage.teams[1].objectives = objectivesForTeam(teamTwoObjectives);

        this.game.storage.meta.teamScores = [
            {
                objectives: teamOneObjectives,
                ui: this.game.storage.teams[0].votes.ui,
                ux: this.game.storage.teams[0].votes.ui,
                tie: teamOneObjectives === teamTwoObjectives,
            },
            {
                objectives: teamTwoObjectives,
                ui: this.game.storage.teams[1].votes.ui,
                ux: this.game.storage.teams[1].votes.ui,
                tie: teamOneObjectives === teamTwoObjectives,
            },
        ];

        return this;
    }

    /**
     * Performs the common operations that are typically done with game seeding,
     * this includes template, season, team score, editors and generated users.
     */
    public async common(): Promise<GameSeeding> {
        let game = this.WithTemplates().withSeason(3).withTeamScores();
        game = await game.withGeneratedPlayers();
        game = await game.withEditors();

        return game;
    }

    /**
     * Creates the given game in the database and returns the given game after
     * it has been created, this is where the game schedule will be created if
     * specified within the construction.
     */
    public async save(): Promise<Game> {
        if (this.shouldCreateSchedule) {
            const status =
                this.game.status === GameStatus.ACTIVE
                    ? GameStatus.SCHEDULED
                    : helpers.randomize([GameStatus.ACTIVE, GameStatus.ENDED]);

            this.gameScheduleSeeding = GameScheduleSeeding.default().withStatus(status);
            this.game.schedule = await this.gameScheduleSeeding.save();
        }

        return await this.game.save();
    }
}
