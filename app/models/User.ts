import {
    AfterInsert,
    AfterLoad,
    AfterUpdate,
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    OneToOne,
} from "typeorm";
import {Activity} from "./Activity";
import BaseModel from "./BaseModel";

import {Badge} from "./Badge";
import {BlogPost} from "./BlogPost";
import {Competitor} from "./Competitor";
import {EmailVerification} from "./EmailVerification";
import {ALL_RANKS, UserProfile} from "./embedded";
import {UserStatistics} from "./embedded";
import {Game} from "./Game";
import {LinkedAccount} from "./LinkedAccount";
import {PasswordReset} from "./PasswordReset";
import {Player} from "./Player";
import {GameApplication} from "./GameApplication";

interface IUserAnalytics {
    [name: string]: string;
}

export enum UserRole {
    PENDING = "PENDING",
    USER = "USER",
    MODERATOR = "MODERATOR",
    ADMIN = "ADMIN",
}

@Entity("users")
export class User extends BaseModel {

    @Column({nullable: true})
    public email: string;

    @Column({nullable: true})
    public username: string;

    @Column({nullable: true})
    public password: string;

    @Column({nullable: true})
    public role: UserRole;

    @Column({nullable: true})
    public token: string;

    @Column({nullable: true})
    public avatarUrl: string;

    @Column("simple-json", {nullable: true})
    public analytics: IUserAnalytics;

    @OneToMany((type) => Activity, (activity) => activity.user)
    public activities: Activity[];

    @OneToMany((type) => BlogPost, (post) => post.author)
    public blogPosts: BlogPost[];

    @Column((type) => UserProfile)
    public profile: UserProfile;

    @OneToOne((type) => Competitor)
    public competitor: Competitor;

    @Column((type) => UserStatistics)
    public statistics: UserStatistics;

    @OneToMany((type) => EmailVerification, (verification) => verification.user)
    public verifications: EmailVerification[];

    @OneToMany((type) => LinkedAccount, (link) => link.user, {eager: true})
    public linkedAccounts: LinkedAccount[];

    @OneToMany((type) => PasswordReset, (reset) => reset.user)
    public passwordResets: PasswordReset[];

    @OneToMany((type) => Player, (player) => player.user)
    public players: Player[];

    @OneToMany((type) => GameApplication, (application) => application.user)
    public gameApplications: Promise<GameApplication[]>;

    @ManyToMany((type) => Game, (game) => game.usersPlayed)
    @JoinTable()
    public playedGames: Promise<Game[]>;

    @ManyToMany((type) => Badge)
    public badges: Promise<Badge[]>;

    @AfterLoad() @AfterUpdate() @AfterInsert()
    private loadRank() {
        this.statistics = this.statistics || {xp: 0, coins: 0, wins: 0, losses: 0};

        this.statistics.rank = ALL_RANKS.find((rank) => {
            return rank.xpRequired <= this.statistics.xp;
        });

        this.statistics.nextRank = ALL_RANKS.find((rank) => {
            return rank.xpRequired > this.statistics.xp;
        });
    }
}
