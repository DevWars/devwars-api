import {AfterLoad, Column, Entity, JoinTable, ManyToMany, OneToMany} from "typeorm";
import BaseModel from "./BaseModel";
import {GameApplication} from "./GameApplication";
import {GameTeam} from "./GameTeam";
import {Objective} from "./Objective";
import {User} from "./User";

export enum GameStatus {
    SCHEDULING, PREPARING, ACTIVE, ENDED,
}

interface ILanguageTemplate {
    language: string;

    content: string;
}

@Entity("games")
export class Game extends BaseModel {
    /**
     * Projected status of the game,
     */
    @Column({default: GameStatus.SCHEDULING})
    public status?: GameStatus;

    /**
     * Scheduled start time
     */
    @Column({type: "datetime"})
    public startTime: Date;

    /**
     * Season number game was broadcasted
     */
    @Column()
    public season: number;

    /**
     * Toggle for whether or not the game is active
     */
    @Column()
    public active: boolean;

    /**
     * Represents which game type we're playing.
     */
    @Column()
    public name: string;

    /**
     * Short description for what this game is about
     */
    @Column({nullable: true})
    public theme: string;

    /**
     * Link to the video recording for this game
     */
    @Column({nullable: true})
    public videoUrl: string;

    @Column("simple-json", {nullable: false})
    public languageTemplates: { [language: string]: string };

    @OneToMany((type) => GameTeam, (team) => team.game)
    public teams: GameTeam[];

    @OneToMany((type) => Objective, (objective) => objective.game)
    public objectives: Objective[];

    @ManyToMany((type) => User, (user) => user.playedGames)
    public usersPlayed: Promise<User[]>;

    @OneToMany((type) => GameApplication, (application) => application.game)
    public userApplications: Promise<GameApplication[]>;

    @AfterLoad()
    public updateActiveFromStatus() {
        this.active = this.status === GameStatus.ACTIVE;
    }

    // get done() {
    //     return this.teams.values().any { it.getWinner() }
    // }
}
