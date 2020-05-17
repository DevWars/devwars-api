import { GameEditorTemplates, GameObjective } from './common';

/**
 * The given game storage object is a json blob and is not another table. It
 * will contain additional core information about the running game and after the
 * game has been completed. This includes players, editor assignments, results.
 */
export interface GameStorage {
    // The template html code that will be used to help get the game up and
    // running faster.
    templates?: GameEditorTemplates;

    // The objectives of the given game, what the teams must do to be win.
    // index is the id of the objective.
    objectives?: { [index: string]: GameObjective };

    // The object of the editors that is related to the given game. including
    // which users have been to assigned to which editor.
    editors?: { [index: string]: GameStorageEditor };

    // any related meta information about hte game, typically containing all the
    // related results and scores of the finished game.
    meta?: GameStorageMeta;
}

/**
 * The meta object of the given game, this includes the winning team, and the
 * scores/results of each team that competed.
 */
export interface GameStorageMeta {
    // The object of scores of the teams that played. the index is the id of the
    // given team/
    teamScores: { [index: string]: GameStorageMetaTeamScore };

    // The id of the winning team.
    winningTeam: number;

    // If the result of the game was a tie or not.
    tie: boolean;

    // The result of the bets that had taken place for the given game, this is
    // the votes related to who will win and who will loose (or tie)
    bets: {
        tie: number;
    };
}

/**
 * The scoring result of the given game per team, this will be used for
 * rendering results on the site.
 */
export interface GameStorageMetaTeamScore {
    // The id of the given team.
    id: number;

    // The status of each objective for the given name in a string format. e.g
    // has the given team completed or not completed the given objectives.
    objectives?: {
        [index: string]: 'complete' | 'incomplete';
    };

    // The number of bets for the given team.
    bets: number;

    // The score the team got from the ui voting stage.
    ui: number;

    // The score the team got from the ux voting stage.
    ux: number;
}

/**
 * The editor object related to a given game, this will include who, what team
 * and what language the given editor will be using.
 */
export interface GameStorageEditor {
    // The id of the given editor.
    id: number;

    // The team the editor is associated with.
    team: number;

    // The id of the player that has been assigned to the game editor.
    player: number;

    // The language the given editor has been assigned.
    language: string;
}
