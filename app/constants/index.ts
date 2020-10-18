// The reserved usernames that cannot be taken by any newly created accounts.
export const RESERVED_USERNAMES = ['admin', 'devwars', 'administrator', 'administration', 'competitor', 'eval'];

// The minimum and maximum length a new/existing users username must respect for
// the user to be registered or authorized with the site.
export const USERNAME_MIN_LENGTH = 4;
export const USERNAME_MAX_LENGTH = 25;

// The minimum number of days required for someone to wait to change there
// username again after the first change.
export const USERNAME_CHANGE_MIN_DAYS = 7;

// Does not allow special characters in the beginning or end of username
export const USERNAME_REGEX = /^[a-zA-Z0-9.-][A-z0-9.-_]{2,23}[a-zA-Z0-9.-]$/;

// currently postgres max int is 4 bytes and any attempt to go over this limit should be rejected
// http://www.postgresqltutorial.com/postgresql-integer/
export const DATABASE_MAX_ID = 2 ** 31 - 1;

// Username limits in regards for twitch when processing requests that is directly related to the
// twitch username. e.g updating twitch coins.
export const TWITCH_USERNAME_MIN_LENGTH = 4;
export const TWITCH_USERNAME_MAX_LENGTH = 25;

// The minimum and maximum length a new/existing users password must respect for
// the user to be registered or authorized with the site.
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;

// The minimum and maximum number of coins that a user can have assigned during the statistics
// generation/creation.
export const STATS_COINS_MIN_AMOUNT = 0;
export const STATS_COINS_MAX_AMOUNT = Infinity;

// The minimum and maximum xp that a user can have at anyone time during the statistics
// generation/creation.
export const STATS_XP_MIN_AMOUNT = 0;
export const STATS_XP_MAX_AMOUNT = Infinity;

// The minimum and maximum level that a user can have at anyone time during the statistics
// generation/creation.
export const STATS_LEVEL_MIN_AMOUNT = 0;
export const STATS_LEVEL_MAX_AMOUNT = Infinity;

// Upper and lower limits of adding and updating twitch coins on a given twitch users account. The
// limits are high but ensuring limits removes the chance of something going wrong with int32 max,
// etc.
export const TWITCH_COINS_MIN_UPDATE = -1000000;
export const TWITCH_COINS_MAX_UPDATE = 1000000;

// Game creation title min and max lengths.
export const GAME_TITLE_MIN_LENGTH = 5;
export const GAME_TITLE_MAX_LENGTH = 124;

// The minimum number the game season can currently be in.
export const GAME_SEASON_MIN = 1;

// The minimal and max title length when creating a new game schedule.
export const GAME_SCHEDULE_TITLE_MIN_LENGTH = 5;
export const GAME_SCHEDULE_TITLE_MAX_LENGTH = 124;

// The min and max length of a given description of a objective of the game.
export const GAME_SCHEDULE_OBJECTIVE_DESCRIPTION_MIN_LENGTH = 5;
export const GAME_SCHEDULE_OBJECTIVE_DESCRIPTION_MAX_LENGTH = 124;

// The min and max length of the contact us name length
export const CONTACT_US_NAME_MIN = 3;
export const CONTACT_US_NAME_MAX = 64;

// the min and max length of the contact message
export const CONTACT_US_MESSAGE_MIN = 24;
export const CONTACT_US_MESSAGE_MAX = 500;

// XP - The experience that can be earned for different actions.
export const EXPERIENCE = {
    // The total amount fo experience earned for participating within a game or
    // event within devwars.
    PARTICIPATION: 800,
    // The total amount of experience gained for winning a game within devwars.
    GAME_WIN: 4000,
    // The total amount of experience lost for losing a game within devwars.
    GAME_LOST: -2400,
    // The total amount of experience gained for getting all objectives within
    // any given event or game that is held within devwars.
    ALL_OBJECTIVES: 2400,
    // The total amount of experience lost when forfeiting a game or event
    // within devwars.
    FORFEIT: -8000,
    // The total amount of experience gained for being the best answer for a
    // form for question asked to the community.
    BEST_FORM_ANSWER: 800,
};

// Id's of all the badges that can be awarded currently in devwars.
export const BADGES = {
    EMAIL_VERIFICATION: 1,
    SINGLE_SOCIAL_ACCOUNT: 2,
    ALL_SOCIAL_ACCOUNT: 3,
    DEVWARS_COINS_5000: 4,
    DEVWARS_COINS_25000: 5,
    BETTING_EARN_10000: 6,
    SUBMIT_IDEA_GET_IMPLEMENTED: 7,
    FIND_BUG_AND_REPORT: 8,
    REFERRAL_5_PEOPLE: 9,
    REFERRAL_25_PEOPLE: 10,
    REFERRAL_50_PEOPLE: 11,
    COMPLETE_ALL_OBJECTIVES: 12,
    WATCH_FIRST_GAME: 13,
    WATCH_5_GAMES: 14,
    WATCH_25_GAMES: 15,
    WATCH_50_GAMES: 16,
    WIN_FIRST_GAME: 17,
    WIN_5_GAMES: 18,
    WIN_10_GAMES: 19,
    WIN_25_GAMES: 20,
    WIN_3_IN_ROW: 21,
    ANSWER_TWITCH_QUIZ_QUESTION: 22,
    ANSWER_10_TWITCH_QUIZ_QUESTION: 23,
    BET_ALL_DEV_COINS_AND_WIN: 24,
    VISIT_ON_BIRTHDAY: 25,
    COMPLETE_POLL: 26,
    COMPLETE_25_POLL: 27,
    BUY_FROM_STORE: 28,
};
