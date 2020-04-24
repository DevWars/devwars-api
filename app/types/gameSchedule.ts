import { GameEditorTemplates, GameObjective } from './common';

export interface GameScheduleSetup {
    // The title of the given game, this is the display name used when showing
    // users of the site players.
    title: string;

    // The mode the game is currently playing, e.g Classic, Blitz.
    mode: string;

    // The session the game will be running under.
    season: number;

    // The template html code that will be used to help get the game up and
    // running faster.
    templates?: GameEditorTemplates;

    // The objectives of the given game, what the teams must do to be win.
    objectives?: { [index: string]: GameObjective };
}
