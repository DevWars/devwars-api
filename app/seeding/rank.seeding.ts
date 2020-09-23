import Rank from '../models/rank.model';

export default class RankSeeding {
    public static default(): Rank[] {
        return [
            new Rank(1, 'Intern I', 0),
            new Rank(2, 'Intern II', 5000),
            new Rank(3, 'Intern III', 10000),
            new Rank(4, 'Trainee I', 20000),
            new Rank(5, 'Trainee II', 25000),
            new Rank(6, 'Trainee III', 30000),
            new Rank(7, 'Developer I', 40000),
            new Rank(8, 'Developer II', 45000),
            new Rank(9, 'Developer III', 50000),
            new Rank(10, 'Engineer I', 60000),
            new Rank(11, 'Engineer II', 65000),
            new Rank(12, 'Engineer III', 70000),
            new Rank(13, 'Hacker I', 80000),
            new Rank(14, 'Hacker II', 85000),
            new Rank(15, 'Hacker III', 90000),
            new Rank(16, 'Webmaster', 100000),
        ];
    }
}
