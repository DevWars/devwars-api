import { Column, Entity, OneToOne, JoinColumn } from 'typeorm';
import BaseModel from './BaseModel';
import User from './User';

@Entity('password_reset')
export default class PasswordReset extends BaseModel {
    @Column()
    public expiresAt: Date;

    @Column()
    public token: string;

    // ------------------------------------------------------------
    // Relations
    @OneToOne((type) => User)
    @JoinColumn()
    public user: User;
}
