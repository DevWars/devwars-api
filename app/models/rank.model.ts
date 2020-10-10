import { Column, Entity } from 'typeorm';
import BaseModel from './base.model';

@Entity('rank')
export default class Rank extends BaseModel {
    /**
     * The level for the given rank being stored.
     */
    @Column()
    public level: number;

    /**
     * The name of the given rank that will be created.
     */
    @Column()
    public name: string;

    /**
     * The total amount of experience required to get to the given rank
     */
    @Column({ name: 'total_experience' })
    public totalExperience: number;

    /**
     * Creates a new instance of the rank model.
     *
     * @param level The level of the given rank.
     * @param name  The name of the given rank.
     * @param totalExperience  The total required experience of the rank.
     */
    constructor(level: number, name: string, totalExperience: number) {
        super();

        this.level = level;
        this.name = name;
        this.totalExperience = totalExperience;
    }
}
