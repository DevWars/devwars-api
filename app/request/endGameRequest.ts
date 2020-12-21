export interface EndGameRequest {
    // The id of the game that has ended.
    id: number;

    // The mode of the game.
    mode: string;

    // The title of the game.
    title: string;

    // The stage the game is in at time of end.
    stage: string;

    // The possible stages of the game.
    stages: Array<string>;

    // End date time in epoc time.
    stageEndAt: number;

    // total runtime in epoc time.
    runTime: number;

    // The objectives that the game had at time of completion. all though sent,
    // the central source, is the database.
    objectives: Array<{
        id: number;
        description: string;
    }>;

    // The teams that the game had at the time of start. all though sent, the
    // central source should be the database.
    teams: Array<{
        id: number;
        name: string;
        completeObjectives: Array<number>;
        objectiveScore: number;
        enabled: true;
    }>;

    // The assigned editors that exist during the games runtime. These exist
    // regardless if anyone was assigned. It will be required to filter out
    // to ones allocated to players.
    editors: Array<{
        id: number;
        language: 'html' | 'css' | 'js';
        fileName: 'index.html' | 'game.css' | 'game.js';
        locked: false;
        teamId: number;
        playerId?: number;
        // Internal to the live editor.
        connection?: {
            socketId: string;
            user: {
                id: number;
                username: string;
                role: string;
                avatarUrl: string;
            };
        };
    }>;

    // Active players within the live editor. This does not mean these are the
    // assigned players, but active. All assigned players should be gathered
    // from the database.
    players: Array<{
        id: number;
        username: string;
        role: string;
        avatarUrl: string;
        ready: boolean;
        teamId: number;
    }>;

    // THe voting outcome for each stage of the process, including the design,
    // and should be determined for each team based on the team id.
    teamVoteResults: Array<{
        category: 'design' | 'function';
        teamId: number;
        votes: number;
        total: number;
        score: number;
    }>;
}
