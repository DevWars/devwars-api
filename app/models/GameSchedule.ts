import { Column, Entity, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import BaseModel from './BaseModel';
import Game from './Game';
import GameApplication from './GameApplication';
import { GameScheduleSetup } from '../types/gameSchedule';

export enum GameStatus {
    SCHEDULED = 0,
    ACTIVE = 1,
    ENDED = 2,
}

@Entity('game_schedule')
export default class GameSchedule extends BaseModel {
    /**
     * Teh expected start time of the given game.
     */
    @Column()
    public startTime: Date;

    /**
     * The current status of the game schedule for the given game.
     */
    @Column({ default: GameStatus.SCHEDULED })
    public status: GameStatus;

    /**
     * Any additional properties that are used to setup the game on creation.
     */
    @Column({ type: 'jsonb' })
    public setup: GameScheduleSetup;

    // ------------------------------------------------------------
    // Relations

    @JoinColumn()
    @OneToOne(() => Game, (game) => game.id, { onDelete: 'CASCADE' })
    public game: Game;

    @OneToMany(() => GameApplication, (applications) => applications.schedule, { cascade: true })
    public applications: GameApplication;

    /**
     * Creates a new instance of the game schedule.
     * @param startTime The start time of the given game schedule
     * @param status The status of the game schedule, e.g active.
     * @param setup The setup information of the given game schedule.
     */
    public constructor(startTime?: Date, status?: GameStatus, setup?: GameScheduleSetup) {
        super();

        this.startTime = startTime;
        this.status = status;
        this.setup = setup;
    }
}
