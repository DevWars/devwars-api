import User from '../models/User';

export default class PlayerFactory {
    // public static default(): Player {
    //     const player = new Player();
    //     Object.assign(player, {
    //         createdAt: new Date(),
    //         language: 'html',
    //         team: GameTeamFactory.default(),
    //         updatedAt: new Date(),
    //     });
    //     return player;
    // }
    // public static withTeamAndLanguage(team: GameTeam, language: string): Player {
    //     return this.withTeamAndLanguageAndUser(team, language);
    // }
    // public static withTeamAndLanguageAndUser(team: GameTeam, language: string, user?: User): Player {
    //     const player = this.default();
    //     player.team = team;
    //     player.language = language;
    //     player.user = user;
    //     return player;
    // }
    // public static defaultPlayersForTeam(team: GameTeam): Player[] {
    //     const html = this.withTeamAndLanguage(team, 'html');
    //     const css = this.withTeamAndLanguage(team, 'css');
    //     const js = this.withTeamAndLanguage(team, 'js');
    //     return [html, css, js];
    // }
}
