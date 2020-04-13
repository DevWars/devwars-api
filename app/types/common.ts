/**
 * Templates that are used in the game, these will be loaded before the game starts ready for the user to use.
 */
export interface IGameEditorTemplates {
    // The template for the html editor that will be inserted before the game starts.
    html?: string;

    // The template for the css editor that will be inserted before the game starts.
    css?: string;

    // The template for the javascript editor that will be inserted before the game starts.
    js?: string;
}

/**
 * The game storage objective that contains all the information about the
 * possible objectives of the given game. Including the id, bonus state and
 * description that will be given to the users.
 */
export interface IGameObjective {
    // The id of the given objective.
    id: number;

    // If the objective is the bonus objective, this is awarded more score
    // compared to other objectives. Commonly unlocked after completing all
    // other.
    isBonus: boolean;

    // The given description of the objective. This is the objective that
    // will be shown to the user, e.g what should be done to be awarded the
    // objective.
    description: string;
}
