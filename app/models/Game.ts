import { Column, Entity, OneToOne } from 'typeorm';
import BaseModel from './BaseModel';
import GameSchedule from './GameSchedule';

export interface IGameStorage {
    mode: string;
    title: string;
    objectives: object;
    players: object;
    editors: object;
    teams: object;
    meta: object;
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
     * Big json object with all game information
     */
    @Column({ type: 'jsonb' })
    public storage: IGameStorage;

    // ------------------------------------------------------------
    // Relations

    @OneToOne((type) => GameSchedule)
    public schedule: GameSchedule;
}
