import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import BaseModel from './base.model';
import User from './user.model';

@Entity('user_stats')
export default class UserStats extends BaseModel {
    // ------------------------------------------------------------
    // Columns
    @Column({ default: 0 })
    public coins: number;

    @Column({ default: 0 })
    public xp: number;

    @Column({ default: 1 })
    public level: number;

    // ------------------------------------------------------------
    // Relations
    @OneToOne(() => User)
    @JoinColumn()
    public user: User;

    /**
     * Creates a new instance of the UserStats model.
     * @param user The user who owns the UserStats model.
     */
    constructor(user?: User) {
        super();

        this.user = user;
    }
}
