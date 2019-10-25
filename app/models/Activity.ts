import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import BaseModel from './BaseModel';
import User from './User';

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
    @ManyToOne((type) => User, (user) => user.activities)
    public user: User;
}
