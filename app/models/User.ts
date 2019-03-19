import { Entity, Column, OneToMany, OneToOne } from 'typeorm';
import BaseModel from './BaseModel';
import LinkedAccount from './LinkedAccount';
import Activity from './Activity';
import UserProfile from './UserProfile';
import UserStats from './UserStats';
import EmailVerification from './EmailVerification';

export enum UserRole {
    PENDING = 'PENDING',
    USER = 'USER',
    MODERATOR = 'MODERATOR',
    ADMIN = 'ADMIN',
}

@Entity('user')
export default class User extends BaseModel {
    @Column()
    public lastSignIn: Date;

    @Column({ unique: true })
    public email: string;

    @Column({ unique: true })
    public username: string;

    @Column()
    public password: string;

    @Column()
    public role: UserRole;

    @Column({ nullable: true })
    public token: string;

    @Column({ nullable: true })
    public avatarUrl: string;

    // ------------------------------------------------------------
    // Relations

    @OneToOne((type) => UserProfile)
    public profile: UserProfile;

    @OneToOne((type) => UserStats)
    public stats: UserStats;

    @OneToOne((type) => EmailVerification)
    public verification: EmailVerification;

    @OneToMany((type) => Activity, (activities) => activities.user)
    public activities: Activity;

    @OneToMany((type) => LinkedAccount, (accounts) => accounts.user)
    public accounts: LinkedAccount;
}
