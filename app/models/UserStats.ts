import { Entity, Column, OneToOne } from 'typeorm';
import BaseModel from './BaseModel';
import { User } from './User';

@Entity('user_stats')
export class UserStats extends BaseModel {
    // ------------------------------------------------------------
    // Columns
    @Column({ default: 0 })
    public coins: number;

    @Column({ default: 0 })
    public xp: number;

    @Column({ default: 1 })
    public level: number;

    @Column({ unique: true, nullable: true })
    public twitchId: string;

    // ------------------------------------------------------------
    // Relations
    @OneToOne((type) => User)
    public user: User;
}
