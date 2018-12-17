import { Column, Entity, ManyToOne } from "typeorm";
import BaseModel from "./BaseModel";
import { User } from "./User";

@Entity("activities")
export class Activity extends BaseModel {
    /**
     * Short description of the activity
     */
    @Column()
    public description: string;

    /**
     * The amount of coins received by the user
     */
    @Column()
    public coins: number;

    /**
     * The amount of xp received by the user
     */
    @Column()
    public xp: number;

    /**
     * Receiving user of the activity
     */
    @ManyToOne((type) => User, (user) => user.activities)
    public user: User;

    // TEMP (just so we can set the id manually for a given user)
    @Column({nullable: true})
    public userId: number;
}
