import { Column, Entity, OneToMany } from 'typeorm';
import * as _ from 'lodash';

import GameApplication from './gameApplication.model';
import { GameStorage } from '../types/game';
import BaseModel from './base.model';

export enum GameStatus {
    SCHEDULED = 0,
    ACTIVE = 1,
    ENDED = 2,
}

export enum GameMode {
    ZenGarden = 'Zen Garden',
    Classic = 'Classic',
    Blitz = 'Blitz',
}

@Entity('game')
export default class Game extends BaseModel {
    @Column()
    // The title of the given game, this is the display name used when showing
    // users of the site players.
    public title: string;

    // The expected start time of the given game.
    @Column()
    public startTime: Date;

    // Season number game was broadcasted
    @Column()
    public season: number;

    // Represents which game mode we are playing
    @Column()
    public mode: GameMode;

    // Link to the video recording for this game
    @Column({ nullable: true })
    public videoUrl: string;

    // TEMPORARY: Status on game until Editor refactor is completed
    @Column({ default: GameStatus.SCHEDULED })
    public status: GameStatus;

    // Big json object with all game information
    @Column({ type: 'jsonb', default: {} })
    public storage: GameStorage;

    // ------------------------------------------------------------
    // Relations
    // ------------------------------------------------------------

    @OneToMany(() => GameApplication, (applications) => applications.game)
    public applications: GameApplication;

    /**
     * Creates a new instance of the games model.
     * @param season Season number game was broadcasted
     * @param mode Represents which game mode we are playing
     * @param title The name or theme of the game.
     * @param videoUrl The video url of the games recording.
     * @param status The status of the game.
     * @param storage Any additional storage of the game.
     */
    public constructor(
        season?: number,
        mode?: GameMode,
        title?: string,
        videoUrl?: string,
        status?: GameStatus,
        startTime?: Date,
        storage?: GameStorage
    ) {
        super();

        this.season = season;
        this.mode = mode;
        this.title = title;
        this.videoUrl = videoUrl;
        this.status = status;
        this.startTime = startTime;
        this.storage = storage;
    }

    /**
     * Adds a template to the given game by the language.
     * @param language The language of the template being added.
     * @param template The raw template string that is being assigned to that template.
     */
    public addTemplate(language: 'html' | 'css' | 'js', template: string) {
        if (_.isNil(this.storage.templates)) this.storage.templates = {};
        this.storage.templates[language] = template;
    }
}
