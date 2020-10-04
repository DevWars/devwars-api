import { getCustomRepository } from 'typeorm';
import { EXPERIENCE } from '../constants';

import User from '../models/user.model';

import UserStatisticsRepository from '../repository/userStatistics.repository';

export default class RankingService {
    /**
     * Increase the total amount of experience for a given list of users for winning a game.
     * @param users The users who will be gaining the amount of experience.
     */
    public static async assignWinningExperienceToUsers(users: User[]) {
        const userStatisticsRepository = getCustomRepository(UserStatisticsRepository);
        await userStatisticsRepository.increaseExperienceForUsers(EXPERIENCE.GAME_WIN, users);
    }

    /**
     * Decrease the total amount of experience for a given list of users for losing a game.
     * @param users The users who will be losing the amount of experience.
     */
    public static async assignLosingExperienceToUsers(users: User[]) {
        const userStatisticsRepository = getCustomRepository(UserStatisticsRepository);
        await userStatisticsRepository.decreaseExperienceForUsers(EXPERIENCE.GAME_LOST, users);
    }

    /**
     * Assign all users that participating within Devwars a given amount of experience.
     * @param users The users who will be gaining the participation amount.
     */
    public static async assignParticipationExperienceToUsers(users: User[]) {
        const userStatisticsRepository = getCustomRepository(UserStatisticsRepository);
        await userStatisticsRepository.increaseExperienceForUsers(EXPERIENCE.PARTICIPATION, users);
    }
}
