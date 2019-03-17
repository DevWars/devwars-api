import { Column, Entity, JoinTable, OneToOne } from 'typeorm';
import BaseModel from './BaseModel';
import { User } from './User';

@Entity('user_profile')
export class UserProfile extends BaseModel {
    // ------------------------------------------------------------
    // Columns
    @Column({ nullable: true })
    public firstName: string;

    @Column({ nullable: true })
    public lastName: string;

    @Column({ nullable: true })
    public dob: Date;

    @Column({ nullable: true })
    public about: Text;

    @Column({ default: false })
    public forHire: boolean;

    @Column({ nullable: true })
    public websiteUrl: string;

    @Column({ nullable: true })
    public addressOne: string;

    @Column({ nullable: true })
    public addressTwo: string;

    @Column({ nullable: true })
    public city: string;

    @Column({ nullable: true })
    public zip: string;

    @Column({ nullable: true })
    public country: string;

    @Column({ type: 'jsonb', nullable: true })
    public skills: object;

    // ------------------------------------------------------------
    // Relations
    @OneToOne((type) => User)
    @JoinTable()
    public user: User;
}
