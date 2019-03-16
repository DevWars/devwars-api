import {Column, Entity, ManyToMany, ManyToOne} from 'typeorm';

import BaseModel from './BaseModel';
import {Game} from './Game';
import {GameTeam} from './GameTeam';

@Entity('objectives')
export class Objective extends BaseModel {
    /**
     * Short description of objective
     */
    @Column({nullable: true})
    public description: string;

    /**
     * Represents order of objective display
     */
    @Column()
    public number: number;

    @ManyToOne((type) => Game, (game: Game) => game.objectives)
    public game: Game;

    @Column({default: false})
    public bonus: boolean;

    // TEMP (just so we can set the id manually for a given user)
    @Column({nullable: true})
    public gameId: number;

    @ManyToMany((type) => GameTeam, (team: GameTeam) => team.completedObjectives)
    public winningTeams: Promise<GameTeam[]>;
}
