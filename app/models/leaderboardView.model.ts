import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity({
    expression: `
    select "userId", username, wins, loses, xp, level, coins + COALESCE(cast(linkedCoins as INTEGER), 0) as coins
    from (select username,
                 wins,
                 loses,
                 xp,
                 coins,
                 level,
                 "user".id as "userId",
                 (select (linked_account.storage ->> 'coins')
                  from linked_account
                           join "user" u on linked_account."userId" = u.id
                  where linked_account.storage ->> 'coins' IS NOT NULL
                    and u.id = "user".id
                 )         as linkedCoins
          from "user"
                   join user_stats userStats on "user".id = userStats."userId"
                   join user_game_stats userGameStats on "user".id = userGameStats."userId"
         ) leaderboards;
    `,
    materialized: true,
    synchronize: false,
})
export default class Leaderboard {
    @ViewColumn()
    public userId: number;

    @ViewColumn()
    public username: string;

    @ViewColumn()
    public wins: number;

    @ViewColumn()
    public loses: number;

    @ViewColumn()
    public xp: number;

    @ViewColumn()
    public coins: number;

    @ViewColumn()
    public level: number;
}
