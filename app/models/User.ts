import {
    AfterInsert,
    AfterLoad,
    AfterUpdate,
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    OneToOne,
} from 'typeorm';
import { Activity } from './Activity';
import BaseModel from './BaseModel';

import { EmailVerification } from './EmailVerification';
import { GameApplication } from './GameApplication';
import { LinkedAccount } from './LinkedAccount';
import { PasswordReset } from './PasswordReset';

export enum UserRole {
    PENDING = 'PENDING',
    USER = 'USER',
    MODERATOR = 'MODERATOR',
    ADMIN = 'ADMIN',
}

@Entity('users')
export class User extends BaseModel {
    // ------------------------------------------------------------
    // Columns
    @Column()
    public lastSignIn: Date;

    @Column({unique: true})
    public email: string;

    @Column({unique: true})
    public username: string;

    @Column()
    public password: string;

    @Column()
    public role: UserRole;

    @Column({nullable: true})
    public token: string;

    @Column({nullable: true})
    public avatarUrl: string;

    // ------------------------------------------------------------
    // Relations
    @OneToMany((type) => Activity, (activity) => activity.user)
    public activities: Activity[];

    @OneToMany((type) => EmailVerification, (verification) => verification.user)
    public verifications: EmailVerification[];

    @OneToMany((type) => LinkedAccount, (link) => link.user, {eager: true})
    public linkedAccounts: LinkedAccount[];

    @OneToMany((type) => PasswordReset, (reset) => reset.user)
    public passwordResets: PasswordReset[];

    @OneToMany((type) => GameApplication, (application) => application.user)
    public gameApplications: Promise<GameApplication[]>;
}
