import { Response } from 'express';
import NewGame from '../models/newGame.model';
import { AuthorizedRequest } from '../request/requests';
import { ArchiveGameRequest } from '../request/archiveGameRequest';

export async function archiveGame(request: AuthorizedRequest, response: Response) {
    const body: ArchiveGameRequest = request.body;

    const game = new NewGame();
    game.season = 4;
    game.title = body.title;
    game.mode = body.mode;
    game.storage = { raw: body };

    const savedGame = await game.save();
    return response.status(201).json(savedGame);
}
