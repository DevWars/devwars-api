import { Request, Response } from 'express';
import * as mime from 'mime';
import NewGame from '../models/newGame.model';
import { AuthorizedRequest } from '../request/requests';
import { ArchiveGameRequest } from '../request/archiveGameRequest';
import User from '../models/user.model';
import ApiError from '../utils/apiError';

function normalizeNewGameToOldGame(game: NewGame) {
    const objectives = {} as any;
    for (const o of game.storage.raw.objectives) {
        objectives[o.id] = {
            id: o.id,
            isBonus: o.bonus,
            description: o.description,
        };
    }

    const teamObjectiveScores = { 0: {}, 1: {} } as any;
    for (const team of game.storage.raw.teams) {
        const teamObjectives = teamObjectiveScores[team.id - 1];
        for (const o of game.storage.raw.objectives) {
            const isComplete = team.completeObjectives.some(objId => objId === o.id);
            teamObjectives[o.id] = isComplete ? 'complete' : 'incomplete';
        }
    }

    function getVoteTotal(teamId: number, category: string) {
        const { teamVoteResults } = game.storage.raw;
        const result = teamVoteResults.find(r => r.teamId === teamId && r.category === category);
        return result?.votes ?? 0;
    }

    const uxCategory = game.mode === 'zen' ? 'responsive' : 'function';
    const meta = {
        teamScores: {
            0: {
                id: 0,
                ui: getVoteTotal(1, 'design'),
                ux: getVoteTotal(1, uxCategory),
                bets: 0,
                objectives: teamObjectiveScores[0],
            },
            1: {
                id: 1,
                ui: getVoteTotal(2, 'design'),
                ux: getVoteTotal(2, uxCategory),
                bets: 0,
                objectives: teamObjectiveScores[1],
            },
        },
    };

    for (const editor of game.storage.raw.editors) {
        delete (editor as any).connection;
    }

    return { ...game, objectives, meta };
}

export async function archiveGame(request: AuthorizedRequest, response: Response): Promise<any> {
    const body: ArchiveGameRequest = request.body;

    const game = new NewGame();
    game.season = 4;
    game.title = body.title;
    game.mode = body.mode;
    game.storage = { raw: body };

    const savedGame = await game.save();
    return response.status(201).json(savedGame);
}

export async function getAllGames(request: Request, response: Response): Promise<any> {
    const newGames = await NewGame.find({ order: { createdAt: 'DESC' } });
    if (!newGames) {
        return response.status(404);
    }

    const games = [];
    for (const game of newGames) {
        games.push(normalizeNewGameToOldGame(game));
    }

    response.json(games);
}

export async function getGameById(request: Request, response: Response): Promise<any>{
    const id = request.params.game;
    const newGame = await NewGame.findOne(id);
    if (!newGame) {
        return response.status(404);
    }

    response.json(normalizeNewGameToOldGame(newGame));
}

export async function getAllGamePlayersById(request: Request, response: Response): Promise<any> {
    const id = request.params.game;
    const game = await NewGame.findOne(id);
    if (!game) {
        return response.status(404);
    }

    const players = [];
    for (const editor of game.storage.raw.editors) {
        delete editor.fileText;
        const user = await User.findOne(editor.playerId);
        if (!user) {
            console.log('deletedUser', editor.playerId);
            return response.send(404);
        }

        const existingPlayer = players.find(p => p.userId === user.id);
        if (existingPlayer) {
            existingPlayer.assignedLanguages.push(editor.language);
            continue;
        }
        // PRINTED
        console.log(user.id, game.storage.raw.editors.map(e => e.playerId));

        const player = {
            gameId: game.id,
            createdAt: game.createdAt,
            updatedAt: game.updatedAt,
            user: { id: user.id, username: user.username, avatarUrl: user.avatarUrl },
            userId: user.id,
            team: editor.teamId - 1,
            assignedLanguages: [editor.language],
        } as any;

        players.push(player);
    }

    response.json(players);
}

export async function serveGameFile(request: Request, response: Response) {
    const { file, team } = request.params;
    const gameId = request.params.game;

    if (!team || !file) {
        throw new ApiError({
            message: 'The specified team must be a valid team id and file must not be empty.',
            code: 400,
        });
    }

    const newGame = await NewGame.findOne(gameId);
    if (!newGame) {
        return response.status(404);
    }

    const editor = newGame.storage.raw.editors.find(e => e.fileName === file && e.teamId === Number(team));
    if (!editor) {
        return response.status(404);
    }

    response.setHeader('Content-Type', mime.getType(editor.fileName));
    return response.send(editor.fileText);
}
