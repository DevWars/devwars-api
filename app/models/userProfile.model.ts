import { Entity, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import BaseModel from './base.model';
import User from './user.model';

export enum Sex {
    MALE = 0,
    FEMALE = 1,
    OTHER = 2,
}

@Entity('user_profile')
export default class UserProfile extends BaseModel {
    // ------------------------------------------------------------
    // Columns
    @Column({ nullable: true })
    public firstName: string;

    @Column({ nullable: true })
    public lastName: string;

    @Column({ nullable: true })
    public dob: Date;

    @Column({ nullable: true })
    public sex: Sex;

    @Column({ type: 'text', nullable: true })
    public about: string;

    @Column({ default: false })
    public forHire: boolean;

    @Column({ nullable: true })
    public company: string;

    @Column({ nullable: true })
    public websiteUrl: string;

    @Column({ nullable: true })
    public addressOne: string;

    @Column({ nullable: true })
    public addressTwo: string;

    @Column({ nullable: true })
    public city: string;

    @Column({ nullable: true })
    public state: string;

    @Column({ nullable: true })
    public zip: string;

    @Column({ nullable: true })
    public country: string;

    @Column({ type: 'jsonb', nullable: true })
    public skills: any;

    // ------------------------------------------------------------
    // Relations


    @Index()
    @OneToOne(() => User)
    @JoinColumn()
    public user: User;

    /**
     * Creates a new instance of the UserProfile model.
     * @param user The user who owns the UserProfile model.
     */
    constructor(user?: User) {
        super();

        this.user = user;
    }
}
