import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import BaseModel from './BaseModel';
import User from './User';

@Entity('email_opt_in')
export default class EmailOptIn extends BaseModel {
    @Column({ name: 'email_opt_in_news', default: true })
    public news: boolean;

    @Column({ name: 'email_opt_in_applications', default: true })
    public gameApplications: boolean;

    @Column({ name: 'email_opt_in_schedules', default: true })
    public schedules: boolean;

    @Column({ name: 'email_opt_in_linked_accounts', default: true })
    public linkedAccounts: boolean;

    // ------------------------------------------------------------
    // Relations

    @OneToOne(() => User)
    @JoinColumn()
    public user: User;

    /**
     * Creates a new instance of the email opt in model.
     *
     * @param user The user who's related to these email settings.
     * @param news If the user is accepting emails related to news/updates.
     * @param applications If the user is accepting emails related to change in game applications.
     * @param schedules If the user is accepting emails in relation to schedule updates/changes.
     * @param linkedAccounts If the user is accepting emails related to linked accounts.
     */
    public constructor(
        user?: User,
        news?: boolean,
        applications?: boolean,
        schedules?: boolean,
        linkedAccounts?: boolean
    ) {
        super();

        this.user = user;
        this.news = news;
        this.gameApplications = applications;
        this.schedules = schedules;
        this.linkedAccounts = linkedAccounts;
    }
}
