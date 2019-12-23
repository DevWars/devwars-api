// The reserved usernames that cannot be taken by any newly created accounts.
export const RESERVED_USERNAMES = ['admin', 'devwars', 'administrator', 'administration', 'competitor', 'eval'];

// The competitor usernames that will be a default reserved username to replace users who have been
// deleted (e.g game application, results, existing displayed data)
export const COMPETITOR_USERNAME = 'Competitor';

// The minimum and maximum length a new/existing users username must respect for
// the user to be registered or authorized with the site.
export const USERNAME_MIN_LENGTH = 4;
export const USERNAME_MAX_LENGTH = 25;

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
