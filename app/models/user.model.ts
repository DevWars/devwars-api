import { Column, Entity, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { isArray, isNil } from 'lodash';

import BaseModel from './base.model';
import LinkedAccount from './linkedAccount.model';
import Activity from './activity.model';
import UserProfile from './userProfile.model';
import UserStats from './userStats.model';
import EmailVerification from './emailVerification.model';
import GameApplication from './gameApplication.model';
import EmailOptIn from './emailOptIn.model';
import PasswordReset from './passwordReset.model';
import UserGameStats from './userGameStats.model';

export enum UserRole {
    BANNED = 'BANNED',

    PENDING = 'PENDING',
    USER = 'USER',
    MODERATOR = 'MODERATOR',
    ADMIN = 'ADMIN',
}

@Entity('user')
export default class User extends BaseModel {
    // The time at which the user actually updated there username, by default
    // this is going to be null since it will allow the user to update there
    // username straight after registering.
    @Column({ default: null })
    public lastUsernameUpdateAt: Date;

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

    @OneToOne(() => UserProfile, (profile) => profile.user)
    public profile: UserProfile;

    @OneToOne(() => UserStats, (stats) => stats.user)
    public stats: UserStats;

    @OneToOne(() => UserGameStats, (stats) => stats.user)
    public gameStats: UserGameStats;

    @OneToOne(() => EmailVerification)
    public verification: EmailVerification;

    @OneToOne(() => EmailOptIn)
    public emailOptIn: EmailOptIn;

    @OneToOne(() => PasswordReset)
    public passwordReset: PasswordReset;

    @OneToMany(() => Activity, (activities) => activities.user)
    public activities: Activity;

    @OneToMany(() => GameApplication, (applications) => applications.user)
    public applications: GameApplication[];

    @OneToMany(() => LinkedAccount, (accounts) => accounts.user)
    public connections: LinkedAccount[];

    /**
     * Creates a new instance of the user model.
     * @param username The username of the user.
     * @param password The already hashed password of the user.
     * @param email The email of the user.
     * @param role The role of the user.
     */
    constructor(username?: string, password?: string, email?: string, role?: UserRole) {
        super();

        this.username = username;
        this.password = password;
        this.email = email;
        this.role = role;
    }

    /**
     * Returns true if the given user is banned or not.
     */
    public isBanned = (): boolean => this.role === UserRole.BANNED;

    /**
     * Returns true if the given user is in pending state or not.
     */
    public isPending = (): boolean => this.role === UserRole.PENDING;

    /**
     * Returns true if the given user is a moderator or not.
     */
    public isModerator = (): boolean => this.role === UserRole.MODERATOR;

    /**
     * Returns true if the given user is a administrator or not.
     */
    public isAdministrator = (): boolean => this.role === UserRole.ADMIN;

    /**
     * Returns true if the given user is a staff member or not.
     */
    public isStaff = (): boolean => this.isAdministrator() || this.isModerator();

    /**
     * Removes a collection of properties from the current user.
     * @param fields The fields (not including password, token) that is also being removed.
     */
    public sanitize(...fields: string[]): User {
        if (isNil(fields) || !isArray(fields)) fields = [];

        fields.push('password', 'token');
        const user = { ...this };

        // remove all the properties specified in the fields list. Ensuring to also delete the users
        // password and token regardless if the user also specified it in the fields listings.
        for (const field of fields) {
            delete user[field as keyof User];
        }

        return user;
    }

    public toJSON(): User {
        const user = { ...this };

        for (const field of ['token', 'password']) {
            delete user[field as keyof User];
        }

        return user;
    }
}
