import { Column } from 'typeorm';

export class UserProfile {
    @Column('text', {nullable: true})
    public about: string;

    @Column({nullable: true})
    public forHire: boolean;

    @Column({nullable: true})
    public location: string;

    @Column({nullable: true})
    public websiteUrl: string;
}
