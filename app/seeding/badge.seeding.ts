import Badge, { BadgeVariant } from '../models/badge.model';

const badges = [
    {
        id: 1,
        name: 'Authentic',
        description: 'Verify your e-mail address',
        coins: 500,
        xp: 0,
    },
    {
        id: 2,
        name: 'Making Links',
        description: 'Connect any one social media account to your profile',
        coins: 900,
        xp: 0,
    },
    {
        id: 3,
        name: 'Full Coverage',
        description: 'Connect all possible social media accounts to your profile',
        coins: 1300,
        xp: 0,
    },
    {
        id: 4,
        name: 'Feed The Pig',
        description: 'Save up 5000 Devcoins',
        coins: 0,
        xp: 0,
    },
    {
        id: 5,
        name: 'Penny-Pincher',
        description: 'Save up 25000 Devcoins',
        coins: 0,
        xp: 0,
    },
    {
        id: 6,
        name: 'High Roller',
        description: 'Earn 10000 Devcoins from betting',
        coins: 0,
        xp: 0,
    },
    {
        id: 7,
        name: 'Innovator',
        description: 'Submit an idea that gets implemented',
        coins: 2100,
        xp: 0,
    },
    {
        id: 8,
        name: 'Exterminator',
        description: 'Find a bug and report it to the DevWars team',
        coins: 1700,
        xp: 0,
    },
    {
        id: 9,
        name: 'Follow Me',
        description: 'Refer 5 friends using your custom referral link',
        coins: 1300,
        xp: 0,
    },
    {
        id: 10,
        name: 'Influential',
        description: 'Refer 25 friends using your custom referral link',
        coins: 2100,
        xp: 0,
    },
    {
        id: 11,
        name: 'Natural Leader',
        description: 'Refer 50 friends using your custom referral link',
        coins: 4100,
        xp: 0,
    },
    {
        id: 12,
        name: 'Ace High',
        description: 'Complete all objectives in a single game of DevWars',
        coins: 2100,
        xp: 0,
    },
    {
        id: 13,
        name: 'First Timer',
        description: 'Watch your first game of DevWars',
        coins: 500,
        xp: 0,
    },
    {
        id: 14,
        name: 'Hobbyist',
        description: 'Watch 5 games of DevWars',
        coins: 900,
        xp: 0,
    },
    {
        id: 15,
        name: 'Biggest Fan',
        description: 'Watch 25 games of DevWars',
        coins: 1300,
        xp: 0,
    },
    {
        id: 16,
        name: 'Obsessed',
        description: 'Watch 50 games of DevWars',
        coins: 2100,
        xp: 0,
    },
    {
        id: 17,
        name: "Beginner's Luck",
        description: 'Win your first game of DevWars',
        coins: 2900,
        xp: 0,
    },
    {
        id: 18,
        name: 'Victorious',
        description: 'Win 5 games of DevWars',
        coins: 900,
        xp: 0,
    },
    {
        id: 19,
        name: 'Hotshot',
        description: 'Win 10 games of DevWars',
        coins: 2100,
        xp: 0,
    },
    {
        id: 20,
        name: 'Steamroller',
        description: 'Win 25 games of DevWars',
        coins: 4900,
        xp: 0,
    },
    {
        id: 21,
        name: 'Hot Streak',
        description: 'Win 3 games of DevWars in a row',
        coins: 1300,
        xp: 0,
    },
    {
        id: 22,
        name: 'On The Ball',
        description: 'Answer first on a Twitch quiz question',
        coins: 900,
        xp: 0,
    },
    {
        id: 23,
        name: 'Smarty Pants',
        description: 'Answer 10 Twitch quiz questions first',
        coins: 1300,
        xp: 0,
    },
    {
        id: 24,
        name: "I'm All In",
        description: 'Bet ALL of your Devcoins in a stream and win',
        coins: 900,
        xp: 0,
    },
    {
        id: 25,
        name: 'Cake Day',
        description: 'Visit DevWars on your birthday',
        coins: 2100,
        xp: 0,
    },
    {
        id: 26,
        name: 'Poll position',
        description: 'Complete a poll or a survey',
        coins: 900,
        xp: 0,
    },
    {
        id: 27,
        name: 'Rapid Response',
        description: 'Complete 25 polls or surveys',
        coins: 3300,
        xp: 0,
    },
    {
        id: 28,
        name: 'Coin Hoarder',
        description: 'Buy this badge from the coinshop to unlock it',
        coins: 0,
        xp: 0,
    },
];

export default class BadgeSeeding {
    public static default(): Badge[] {
        return badges.map((b) => {
            const badge = new Badge(b.name, b.description, b.xp, b.coins, BadgeVariant.Bronze);
            badge.id = b.id;

            return badge;
        });
    }
}
