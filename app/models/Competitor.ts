import {Column, Entity, JoinColumn, OneToOne} from 'typeorm';
import BaseModel from './BaseModel';
import {Address, Name} from './embedded';
import {User} from './User';

interface ILanguageRatings {
    [language: string]: number;
}

@Entity('competitors')
export class Competitor extends BaseModel {
    /**
     * Full Name
     */
    @Column((type) => Name)
    public name: Name;

    /**
     * Full Address
     */
    @Column((type) => Address)
    public address: Address;

    /**
     * Date of birth
     */
    @Column({type: 'datetime', nullable: true})
    public dob: Date;

    /**
     * User specified ratings for proficiency in each language
     */
    @Column('simple-json')
    public ratings: ILanguageRatings;

    @OneToOne((type) => User)
    @JoinColumn()
    public user: User;

    // TEMP (just so we can set the id manually for a given user)
    @Column({nullable: true})
    public userId: number;
}
