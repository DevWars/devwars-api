import User from '../models/User';
import { IGameEditorTemplates, IGameObjective } from './common';

/**
 * The given game storage object is a json blob and is not another table. It
 * will contain additional core information about the running game and after the
 * game has been completed. This includes players, editor assignments, results.
 */
export interface IGameStorage {
    // The title of the given game, this is the display name used when showing
    // users of the site players.
    title: string;

    // The mode the game is currently playing, e.g Classic, Blitz.
    mode: string;

    // The time the given game started at.
    startTime?: Date;

    // The template html code that will be used to help get the game up and
    // running faster.
    templates?: IGameEditorTemplates;

    // The objectives of the given game, what the teams must do to be win.
    objectives?: { [index: string]: IGameObjective };

    // The objective of players that have been assigned to the given game. This
    // can be expanded into the users object containing the players and users
    // information, so the type supports its self and its self with the user
    // object.
    players?: { [index: string]: IGameStoragePlayer | (IGameStoragePlayer & User) };

    // The teams objective, containing a list of the teams playing, including
    // the id of the team, name and which objectives have been completed.
    teams?: { [index: number]: IGameStorageTeam };

    // The object of the editors that is related to the given game. including
    // which users have been to assigned to which editor.
    editors?: { [index: string]: IGameStorageEditor };

    // any related meta information about hte game, typically containing all the
    // related results and scores of the finished game.
    meta?: IGameStorageMeta;
}

/**
 * The meta object of the given game, this includes the winning team, and the
 * scores/results of each team that competed.
 */
export interface IGameStorageMeta {
    // The array of scores of the teams that played.
    teamScores: IGameStorageMetaTeamScore[];

    // The id of the winning team.
    winningTeam: number;
}

/**
 * The scoring result of the given game per team, this will be used for
 * rendering results on the site.
 */
export interface IGameStorageMetaTeamScore {
    // The score the team got from the ui voting stage.
    ui: number;

    // The score the team got from the ux voting stage.
    ux: number;

    // If the result of the game was a tie or not.
    tie: boolean;

    // The total number of objectives the give team has completed.
    objectives: number;
}

/**
 * The editor object related to a given game, this will include who, what team
 * and what language the given editor will be using.
 */
export interface IGameStorageEditor {
    // The id of the given editor.
    id: number;

    // The team the editor is associated with.
    team: number;

    // The id of the player that has been assigned to the game editor.
    player: number;

    // The language the given editor has been assigned.
    language: string;
}

/**
 * The teams objective, containing a list of the teams playing, including the id
 * of the team, name and which objectives have been completed.
 */
export interface IGameStorageTeam {
    // The id of the given team.
    id: number;

    // The name of the given team.
    name: string;

    // The voting output results of each stage (ui, ux and tie) for when the
    // game has been completed.
    votes?: {
        // The score the team got from the ui voting stage.
        ui: number;

        // The score the team got from the ux voting stage.
        ux: number;

        // If the result of the game was a tie or not.
        tie: boolean;
    };

    // The status of each objective for the given name in a string format. e.g
    // has the given team completed or not completed the given objectives.
    objectives?: {
        [index: string]: 'complete' | 'not_complete';
    };
}

/**
 * The player object that is currently assigned to the given game. This is used
 * as a reference point to the editor object that will contain the information
 * about what the player is doing on the team.
 */
export interface IGameStoragePlayer {
    // The id of the given player.
    id: number;
    // The id of the team that the given player has been assigned too.
    team: number;

    // The username of the player that has been assigned to the game.
    username: string;

    // @optional -  The profile image of the user, that was assigned.
    // If not assigned, will fall back to the default value.
    avatarUrl?: string;
}
