import {Column, Entity, JoinTable, ManyToMany} from "typeorm";

import {BadgeFactory} from "../factory/Badge.factory";

import BaseModel from "./BaseModel";
import {User} from "./User";

@Entity("badges")
export class Badge extends BaseModel {

    /**
     * Display name of the badge
     */
    @Column({unique: true})
    public name: string;

    /**
     * Short description of the badge
     */
    @Column()
    public description: string;

    /**
     * Amount of coins received by user upon reward
     */
    @Column()
    public coins: number;

    /**
     * Amount of coins received by user upon reward.
     */
    @Column()
    public xp: number;

    @ManyToMany((type) => User)
    @JoinTable()
    public users: User[];
}

// @ts-ignore
export const ALL_BADGES: Badge[] = [
    BadgeFactory.create("Authentic", "Verify your email address", 500, 0),
    BadgeFactory.create("Making Links", "Connect any one social media account to your profile", 900, 0),
    BadgeFactory.create("Full Coverage", "Connect all possible social media accounts to your profile", 1300, 0),
    BadgeFactory.create("Feed The Pig", "Save up 5,000 DevCoins", 0, 0),
    BadgeFactory.create("Penny-Pincher", "Save up 25,000 DevCoins", 0, 0),
    BadgeFactory.create("High Roller", "Earn 10,000 DevCoins from betting", 0, 0),
    BadgeFactory.create("Innovator", "Submit an idea that gets implemented", 2100, 0),
    BadgeFactory.create("Exterminator", "Find a bug and report it to the DevWars team", 1700, 0),
    BadgeFactory.create("Follow Me", "Refer 5 friends using your custom referral link", 1300, 0),
    BadgeFactory.create("Influential", "Refer 25 friends using your custom referral link", 2100, 0),
    BadgeFactory.create("Natural Leader", "Refer 50 friends using your custom referral link", 4100, 0),
    BadgeFactory.create("Ace High", "Complete all objectives in a single game of DevWars", 2100, 0),
    BadgeFactory.create("First Timer", "Watch your first game of DevWars", 500, 0),
    BadgeFactory.create("Hobbyist", "Watch 5 games of DevWars", 900, 0),
    BadgeFactory.create("Biggest Fan", "Watch 25 games of DevWars", 1300, 0),
    BadgeFactory.create("Obsessed", "Watch 50 games of DevWars", 2100, 0),
    BadgeFactory.create("Beginner's Luck", "Win your first game of DevWars", 2900, 0),
    BadgeFactory.create("Victorious", "Win 5 games of DevWars", 900, 0),
    BadgeFactory.create("Hotshot", "Win 10 games of DevWars", 2100, 0),
    BadgeFactory.create("Steamroller", "Win 25 games of DevWars", 4900, 0),
    BadgeFactory.create("Hot Streak", "Win 3 games of DevWars in a row", 1300, 0),
    BadgeFactory.create("On The Ball", "Answer first on a Twitch quiz question", 900, 0),
    BadgeFactory.create("Smarty Pants", "Answer 10 Twitch quiz questions first", 1300, 0),
    BadgeFactory.create("I'm All In", "Bet ALL of your DevCoins in a stream and win", 900, 0),
    BadgeFactory.create("Cake Day", "Visit DevWars on your birthday", 2100, 0),
    BadgeFactory.create("Poll Position", "Complete a poll or a survey", 900, 0),
    BadgeFactory.create("Rapid Response", "Complete 25 polls or surveys", 3300, 0),
    BadgeFactory.create("Bit Hoarder", "Buy this badge from the Shop to unlock it", 0, 0),
    BadgeFactory.create("???", "???", 0, 0),
    BadgeFactory.create("???", "???", 0, 0),
    BadgeFactory.create("???", "???", 0, 0),
];
