import { Column } from 'typeorm';

export class Name {
    @Column({nullable: true})
    public firstName: string;

    @Column({nullable: true})
    public lastName: string;
}
