import { Entity, ManyToOne, Column } from 'typeorm';

import BaseModel from './BaseModel';
import User from './User';
import Game from './Game';

@Entity('game_application')
export default class GameApplication extends BaseModel {
    // If the application was selected to play the given game.
    @Column({ default: false })
    public selected: boolean;

    // The id of the team the given user has been assigned too.
    @Column({ nullable: true })
    public team: number;

    // The assigned language of the given user.
    @Column({ nullable: true })
    public assignedLanguage: string;

    // ------------------------------------------------------------
    // Relations
    // ------------------------------------------------------------

    // The game that the user is applying too.
    @ManyToOne(() => Game, (game) => game.applications, { onDelete: 'CASCADE' })
    public game: Game;

    // The user who applied to the given game.
    @ManyToOne(() => User, (user) => user.applications)
    public user: User;

    /**
     * Creates a new instance of the game application instance.
     * @param game The game that the user is applying to.
     * @param user The user who is applying to the game schedule.
     */
    constructor(game?: Game, user?: User) {
        super();

        this.game = game;
        this.user = user;
    }
}
