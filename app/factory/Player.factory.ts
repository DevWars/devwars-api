import {GameTeamFactory, UserFactory} from "./";

import {GameTeam, Player} from "../models";

export class PlayerFactory {
    public static default(): Player {
        const player = new Player();

        Object.assign(player, {
            createdAt: new Date(),
            language: "html",
            team: GameTeamFactory.default(),
            updatedAt: new Date(),
        });

        return player;
    }

    public static withTeamAndLanguage(team: GameTeam, language: string): Player {
        const player = this.default();

        player.team = team;
        player.language = language;

        return player;
    }

    public static defaultPlayersForTeam(team: GameTeam): Player[] {
        const html = this.withTeamAndLanguage(team, "html");
        const css = this.withTeamAndLanguage(team, "css");
        const js = this.withTeamAndLanguage(team, "js");

        return [html, css, js];
    }
}
