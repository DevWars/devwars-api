import { Column, Entity, ManyToOne } from "typeorm";
import BaseModel from "./BaseModel";
import { User } from "./User";

@Entity("linked_accounts")
export class LinkedAccount extends BaseModel {
    /**
     * Given username from provider
     */
    @Column()
    public username: string;

    /**
     * Used to store information about a linked account
     * before the account has been linked to DevWars
     */
    @Column("simple-json", {nullable: true})
    public storage: object;

    /**
     * Third-party account provider
     */
    @Column()
    public provider: string;

    /**
     * UUID given from the third-party provider
     */
    @Column()
    public providerId: string;

    /**
     * The associated user
     */
    @ManyToOne((type) => User, (user) => user.linkedAccounts)
    public user: User;

    // TEMP (just so we can set the id manually for a given user)
    @Column({nullable: true})
    public userId: number;
}
