import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import BaseModel from './BaseModel';
import User from './User';

@Entity('user_game_stats')
export default class UserGameStats extends BaseModel {
    // ------------------------------------------------------------
    // Columns
    @Column({ default: 0 })
    public wins: number;

    @Column({ default: 0 })
    public loses: number;

    // ------------------------------------------------------------
    // Relations
    @OneToOne((type) => User)
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
