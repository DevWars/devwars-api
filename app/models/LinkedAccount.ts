import { Entity, Column, JoinTable, ManyToOne } from 'typeorm';
import BaseModel from './BaseModel';
import User from './User';

export enum Provider {
    TWITCH = 'TWITCH',
    DISCORD = 'DISCORD',
}

@Entity('linked_account')
export default class LinkedAccount extends BaseModel {
    /**
     * Given username from provider
     */
    @Column()
    public username: string;

    /**
     * Used to store information about a linked account
     * before the account has been linked to DevWars
     */
    @Column({ type: 'jsonb', default: {} })
    public storage: any;

    /**
     * Third-party account provider name
     */
    @Column()
    public provider: string;

    /**
     * UUID given from the third-party provider
     */
    @Column()
    public providerId: string;

    // ------------------------------------------------------------
    // Relations

    @ManyToOne((type) => User, (user) => user.accounts)
    @JoinTable()
    public user: User;
}
