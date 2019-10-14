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

    /**
     * Creates a new instance of the password reset model.
     * @param user The user of the password reset process.
     * @param token The associated verification token of the reset process.
     * @param expiresAt When the password reset process will expire.
     */
    constructor(user?: User, token?: string, expiresAt?: Date) {
        super();

        this.user = user;
        this.token = token;
        this.expiresAt = expiresAt;
    }
}
