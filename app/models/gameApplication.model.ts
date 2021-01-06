import { Entity, ManyToOne, Column, JoinColumn } from 'typeorm';

import BaseModel from './base.model';
import User from './user.model';
import Game from './game.model';

@Entity('game_application')
export default class GameApplication extends BaseModel {
    // The id of the team the given user has been assigned too.
    @Column({ nullable: true })
    public team: number;

    // The assigned language of the given user.
    @Column('simple-array', { nullable: true })
    public assignedLanguages: string[];

    // ------------------------------------------------------------
    // Relations
    // ------------------------------------------------------------

    // The id of the game.
    @Column({ nullable: true })
    gameId: number;

    // The game that the user is applying too.
    @ManyToOne(() => Game, (game) => game.applications, { onDelete: 'CASCADE' })
    public game: Game;

    // The id of the user.
    @Column({ nullable: true })
    userId: number;

    // The user who applied to the given game.
    @JoinColumn()
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
