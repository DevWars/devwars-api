export interface ArchiveGameRequest {
    mode: string;

    title: string;

    runTime: number; // in milliseconds

    objectives: Array<{
        id: number;
        description: string;
    }>;

    teams: Array<{
        id: number;
        name: string;
        completeObjectives: number[];
        objectiveScore: number;
    }>;

    editors: Array<{
        id: number;
        language: string; // html, css, js
        fileName: string;
        locked: false;
        teamId: number;
        playerId?: number;
    }>;

    players: Array<{
        id: number;
        username: string;
        role: string;
        avatarUrl: string;
        teamId: number;
    }>;

    teamVoteResults: Array<{
        category: string; // design, function, responsive
        teamId: number;
        votes: number;
        total: number;
        score: number;
    }>;
}
