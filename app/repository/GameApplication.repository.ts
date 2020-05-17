import { EntityRepository, Repository } from 'typeorm';

import GameApplication from '../models/GameApplication';
import User from '../models/User';
import Game from '../models/Game';

@EntityRepository(GameApplication)
export default class GameApplicationRepository extends Repository<GameApplication> {
    /**
     * Finds all applications for the given user.
     * @param user The user who owns the given game.
     */
    public findByUser(user: User): Promise<GameApplication[]> {
        return this.find({ where: { user }, relations: ['game'] });
    }

    /**
     * Checks to see if a given application exists for a given user and game.
     * @param user The user who owns the application.
     * @param game The game that the application is within.
     */
    public async existsByUserAndGame(user: User, game: Game): Promise<boolean> {
        const found = await this.count({
            where: { user, game },
            select: ['id'],
        });

        return found >= 1;
    }

    /**
     * Finds a given game application for a given user for a given game.
     * @param user The user who owns the application.
     * @param game The game the application is related too.
     * @param relations The additional relations on the game application object
     * to expand.
     */
    public findByUserAndGame(user: User, game: Game, relations: string[] = []): Promise<GameApplication> {
        return this.findOne({ where: { user, game }, relations });
    }

    /**
     * Returns a range of the game applications for a given game.
     * @param game The game that will be used to find the applications.
     * @param relations The additional relations on the game application object
     * to expand.
     */
    public async findByGame(game: Game, relations: string[] = []): Promise<GameApplication[]> {
        return this.find({
            where: {
                game,
            },
            relations,
        });
    }

    /**
     * Returns a range of the game applications for a given game that have been selected to play.
     * @param game The game that will be used to find the applications.
     * @param relations The additional relations on the game application object
     * to expand.
     */
    public async findAssignedPlayersForGame(game: Game, relations: string[] = []): Promise<GameApplication[]> {
        return this.find({
            where: {
                game,
                selected: true,
            },
            relations,
        });
    }

    /**
     * Returns true if and only if the language is in use for the given game and
     * the given team.
     *
     * @param game The game that the language is being checked on.
     * @param team The team that the language is being checked on.
     * @param language  The language that is being checked.
     */
    public async isGameLanguageAssigned(game: Game, team: number, language: string): Promise<boolean> {
        const result = await this.count({
            where: {
                game,
                team,
                assignedLanguage: language.toLowerCase(),
            },
        });

        return result >= 1;
    }

    /**
     * Returns true if the given player is already assigned.
     * @param user The user who is checking to be assigned.
     * @param game The game which is being checked.
     */
    public async isPlayerAlreadyAssigned(user: User, game: Game): Promise<boolean> {
        const result = await this.count({
            where: {
                user,
                game,
                selected: true,
            },
        });

        return result >= 1;
    }

    /**
     * assign the player to the given game.
     * @param user The user who is being unassigned.
     * @param game The game the user is being unassigned from.
     * @param team The team the player has been assigned too.
     * @param language The language the user has been applied too.
     */
    public async assignUserToGame(user: User, game: Game, team: number, language: string): Promise<void> {
        await this.update(
            {
                user,
                game,
            },
            {
                selected: true,
                team: team,
                assignedLanguage: language.toLowerCase(),
            }
        );
    }

    /**
     * removes the player from the given game.
     * @param user The user who is being unassigned.
     * @param game The game the user is being unassigned from.
     */

    public async removeUserFromGame(user: User, game: Game) {
        this.update(
            {
                user,
                game,
            },
            {
                selected: false,
                team: null,
            }
        );
    }

    /**
     * Get all the applications for the given game and team.
     * @param game The game in which the players are within.
     * @param team The team id the players where assigned too.
     * @param relations The additional relations to pull back.
     */
    public async getAssignedPlayersForTeam(
        game: Game,
        team: number,
        relations: string[] = []
    ): Promise<GameApplication[]> {
        return this.find({
            where: {
                game,
                selected: true,
                team,
            },
            relations,
        });
    }
}
