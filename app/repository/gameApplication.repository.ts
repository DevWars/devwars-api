import { EntityRepository, Repository, IsNull, Not, In } from 'typeorm';
import * as _ from 'lodash';

import GameApplication from '../models/gameApplication.model';
import User from '../models/user.model';
import Game from '../models/game.model';

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
        return this.find({ where: { game }, relations });
    }

    /**
     * Returns a range of the game applications for a given game that have been selected to play.
     * @param game The game that will be used to find the applications.
     * @param relations The additional relations on the game application object
     * to expand.
     */
    public async findAssignedPlayersForGame(game: Game, relations: string[] = []): Promise<GameApplication[]> {
        return this.find({ where: { game, team: Not(IsNull()) }, relations });
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
        const result = await this.createQueryBuilder('application')
            .where('application.game = :game', { game: game.id })
            .andWhere('application.team = :team', { team: team })
            .andWhere('application.assignedLanguages LIKE :language', { language: `%${language}%` })
            .getCount();

        return result >= 1;
    }

    /**
     * Returns true if the given player is already assigned.
     * @param user The user who is checking to be assigned.
     * @param game The game which is being checked.
     */
    public async isPlayerAlreadyAssignedToAnotherTeam(user: User, game: Game, teamId: number): Promise<boolean> {
        const result = await this.count({ where: { user, game, team: Not(teamId) } });
        return result >= 1;
    }

    /**
     * assign the player to the given game.
     * @param user The user who is being unassigned.
     * @param game The game the user is being unassigned from.
     * @param team The team the player has been assigned too.
     * @param languages The languages the user has been applied too.
     */
    public async assignUserToGame(user: User, game: Game, team: number, languages: string[]): Promise<void> {
        await this.update({ user, game }, { team: team, assignedLanguages: languages });
    }

    /**
     * removes the player from the given game.
     * @param user The user who is being unassigned.
     * @param game The game the user is being unassigned from.
     */

    public async removeUserFromGame(user: User, game: Game) {
        this.update({ user, game }, { team: null, assignedLanguages: [] });
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
        if (_.isNil(team)) return [];

        return this.find({ where: { game, team }, relations });
    }
}
