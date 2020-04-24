import { GameEditorTemplates, GameObjective } from '../types/common';

export interface CreateGameScheduleRequest {
    // The expected start time of the given game, this is when the game.
    startTime: Date;

    // The mode the game is currently playing, e.g Classic, Blitz.
    mode: string;

    // The title of the given game, this is the display name used when showing
    // users of the site players.
    title: string;

    // The objectives of the given game, what the teams must do to be win.
    objectives?: { [index: string]: GameObjective };

    // The template html code that will be used to help get the game up and
    // running faster.
    templates?: GameEditorTemplates;
}

export interface UpdateGameScheduleRequest {
    // The expected start time of the given game, this is when the game.
    startTime: Date;

    // The mode the game is currently playing, e.g Classic, Blitz.
    mode: string;

    // The title of the given game, this is the display name used when showing
    // users of the site players.

    title: string;

    // The objectives of the given game, what the teams must do to be win.
    objectives?: { [index: string]: GameObjective };

    // The template html code that will be used to help get the game up and
    // running faster.
    templates?: GameEditorTemplates;
}
