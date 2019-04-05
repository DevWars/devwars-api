import { Column, Entity, OneToOne } from 'typeorm';
import BaseModel from './BaseModel';
import GameSchedule from './GameSchedule';

// TEMPORARY: Status on game until Editor refactor is completed
enum GameStatus {
    SCHEDULED,
    ACTIVE,
    ENDED,
}

@Entity('game')
export default class Game extends BaseModel {
    /**
     * Season number game was broadcasted
     */
    @Column()
    public season: number;

    /**
     * Represents which game mode we are playing.
     */
    @Column()
    public mode: string;

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
    @Column({ type: 'jsonb' })
    public storage: any;

    // ------------------------------------------------------------
    // Relations

    @OneToOne((type) => GameSchedule)
    public schedule: GameSchedule;
}
