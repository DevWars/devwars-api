import { Column, Entity, Index, JoinTable, ManyToOne } from 'typeorm';
import BaseModel from './base.model';
import User from './user.model';

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
    @Index()
    @Column()
    public providerId: string;

    // ------------------------------------------------------------
    // Relations

    @Index()
    @ManyToOne(() => User, (user) => user.connections)
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

    public toJSON(): LinkedAccount {
        const { username, provider } = { ...this };
        return { username, provider: provider.toLowerCase() } as LinkedAccount;
    }
}
