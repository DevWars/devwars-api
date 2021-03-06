import { Entity, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import BaseModel from './base.model';
import User from './user.model';

@Entity('user_game_stats')
export default class UserGameStats extends BaseModel {
    /**
     * The total number of wins the user has occurred on the platform.
     */
    @Column({ default: 0, nullable: false })
    public wins: number;

    /**
     * The total number of wins the given user is currently had in a row.
     */
    @Column({ default: 0, nullable: false, name: 'win_streak' })
    public winStreak: number;

    /**
     * The total number of loses the given player has occurred on the platform.
     */
    @Column({ default: 0, nullable: false })
    public loses: number;

    /**
     * The last played game for any game for the given user.
     */
    // @Column({ name: 'last_played', default: new Date('0001-01-01T00:00:00Z'), nullable: false })
    // public lastPlayed: Date;

    // ------------------------------------------------------------
    // Relations
    // ------------------------------------------------------------

    /**
     * The user who owns this user game state.
     */

    @Index()
    @OneToOne(() => User, (user) => user.id)
    @JoinColumn()
    public user: User;

    /**
     * Creates a new instance of the UserGameStats model.
     * @param user The user who owns the UserGameStats model.
     */
    constructor(user?: User) {
        super();

        this.user = user;
    }
}
