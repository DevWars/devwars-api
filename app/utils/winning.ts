import {GameTeam} from "../models";

export const pointsForTeam = async (team: GameTeam): Promise<number> => {
    let points = 0;

    // Plus one point per completed objective
    points += team.completedObjectives.length;

    // They Aced it
    if (team.completedObjectives.length === team.game.objectives.length) {
        points += 1;
    }

    return points;
};
