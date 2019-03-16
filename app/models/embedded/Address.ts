import { Column } from 'typeorm';

export class Address {
    @Column({nullable: true})
    public addressOne: string;

    @Column({nullable: true})
    public addressTwo: string;

    @Column({nullable: true})
    public city: string;

    @Column({nullable: true})
    public state: string;

    @Column({nullable: true})
    public zip: string;

    @Column({nullable: true})
    public country: string;
}
