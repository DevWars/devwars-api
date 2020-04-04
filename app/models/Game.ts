import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import BaseModel from './BaseModel';
import GameSchedule from './GameSchedule';
import { IGameStorage } from '../types/game';

// TEMPORARY: Status on game until Editor refactor is completed
export enum GameStatus {
    SCHEDULED,
    ACTIVE,
    ENDED,
}

export enum GameMode {
    ZenGarden = 'Zen Garden',
    Classic = 'Classic',
    Blitz = 'Blitz',
}

@Entity('game')
export default class Game extends BaseModel {
    /**
     * Season number game was broadcasted
     */
    @Column()
    public season: number;

    /**
     * Represents which game mode we are playing
     */
    @Column()
    public mode: GameMode;

    /**
     * Name or theme of the game
     */
    @Column()
    public title: string;

    /**
     * Link to the video recording for this game
     */
    @Column({ nullable: true })
    public videoUrl: string;

    /**
     * TEMPORARY: Status on game until Editor refactor is completed
     */
    @Column({ default: GameStatus.SCHEDULED })
    public status: GameStatus;

    /**
     * Big json object with all game information
     */
    @Column({ type: 'jsonb', default: {} })
    public storage: IGameStorage;

    // ------------------------------------------------------------
    // Relations

    @JoinColumn()
    @OneToOne(() => GameSchedule, { cascade: true })
    public schedule: GameSchedule;
}
