import {Column, Entity, JoinTable, ManyToMany, OneToMany, AfterLoad} from "typeorm";
import BaseModel from "./BaseModel";
import {GameTeam} from "./GameTeam";
import {LanguageTemplate} from "./LanguageTemplate";
import {Objective} from "./Objective";
import {User} from "./User";
import {GameApplication} from "./GameApplication";

export enum GameStatus {
    SCHEDULING, PREPARING, ACTIVE, ENDED,
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

    @OneToMany((type) => LanguageTemplate, (template) => template.game, {eager: true})
    public languageTemplates: LanguageTemplate[];

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
