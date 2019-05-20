import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import BaseModel from './BaseModel';
import User from './User';

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

    /**
     * Gender is specified as a single 4-bit character, with the range of 26 possible options with
     * a total of 52 if being case insensitive. This will cover them for the base M and F with
     * the option to support a larger range of inclusivity if possible..
     *
     * Null support for if the user does not want to provide there gender during creation.
     */
    @Column({ nullable: true, length: 1 })
    public gender: string;

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
    public skills: object;

    // ------------------------------------------------------------
    // Relations
    @OneToOne((type) => User)
    @JoinColumn()
    public user: User;
}
