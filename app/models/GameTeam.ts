import {Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany} from "typeorm";

import BaseModel from "./BaseModel";
import {Game} from "./Game";
import {Objective} from "./Objective";
import {Player} from "./Player";

interface IVotes {
    [phase: string]: number;
}

@Entity("game_teams")
export class GameTeam extends BaseModel {

    /**
     * Display name
     */
    @Column()
    public name: string;

    /**
     * Whether or not this team won
     */
    @Column()
    public winner: boolean;

    /**
     * Short description of the team's current preparation status
     */
    @Column({nullable: true})
    public status: string;

    @Column("simple-json")
    public votes: IVotes;

    /**
     * Game which this team is associated with
     */
    @ManyToOne((type) => Game, (game) => game.teams)
    public game: Game;

    @OneToMany((type) => Player, (player) => player.team, {eager: true})
    public players: Player[];

    // TEMP (just so we can set the id manually for a given user)
    @Column({nullable: true})
    public gameId: number;

    @ManyToMany((type) => Objective, (objective: Objective) => objective.winningTeams, {eager: true})
    @JoinTable()
    public completedObjectives: Objective[];

    constructor() {
        super();

        this.winner = false;
        this.votes = {};

        this.status = "Waiting for players";
    }
}
