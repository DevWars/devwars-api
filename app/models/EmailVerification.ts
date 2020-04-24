import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import BaseModel from './BaseModel';
import User from './User';

@Entity('email_verification')
export default class EmailVerification extends BaseModel {
    @Column()
    public token: string;

    // ------------------------------------------------------------
    // Relations
    @OneToOne(() => User)
    @JoinColumn()
    public user: User;
}
