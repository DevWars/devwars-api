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

    /**
     * Creates a new instance of a linked account model.
     * @param user The user who is the owner of the linked account.
     * @param linkUsername The username of the linked account.
     * @param provider The provider of the linked account (twitch, discord).
     * @param providerId The users id of the given linked account.
     */
    constructor(user?: User, linkUsername?: string, provider?: string, providerId?: string) {
        super();

        this.user = user;
        this.username = linkUsername;
        this.provider = provider;
        this.providerId = providerId;
        this.storage = {};
    }
}
