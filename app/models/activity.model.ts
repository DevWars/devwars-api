import { Column, Entity, ManyToOne } from 'typeorm';
import BaseModel from './base.model';
import User from './user.model';

@Entity('activity')
export default class Activity extends BaseModel {
    /**
     * Short description of the activity
     */
    @Column()
    public description: string;

    /**
     * The amount of coins received by the user
     */
    @Column({ default: 0 })
    public coins: number;

    /**
     * The amount of xp received by the user
     */
    @Column({ default: 0 })
    public xp: number;

    /**
     * Receiving user of the activity
     */
    @ManyToOne(() => User, (user) => user.activities)
    public user: User;
}
