import {hash} from "../app/utils/hash";

import * as typeorm from "typeorm";

import {Connection} from "../config/Database";

import {
    CompetitorFactory,
    GameFactory,
    GameTeamFactory,
    ObjectiveFactory,
    PlayerFactory,
    UserFactory,
} from "../app/factory";
import {UserRole} from "../app/models";

let connected: typeorm.Connection;

const generateConstantUsers = async () => {
    for (const role of ["admin", "moderator", "user"]) {
        const user = UserFactory.withUsername(`test-${role}`);

        user.role = (UserRole as any)[role.toUpperCase()];
        user.password = await hash("secret");

        await user.save();
    }

    const competitiveUser = UserFactory.withUsername("test-competitor");
    competitiveUser.role = UserRole.USER;
    competitiveUser.password = await hash("secret");

    const competitor = CompetitorFactory.withUser(competitiveUser);

    await competitiveUser.save();
    await competitor.save();
};

const generateBasicUsers = async () => {
    await generateConstantUsers();

    await connected.manager.transaction(async (em) => {
        for (let i = 0; i < 500; i++) {
            const user = UserFactory.default();
            user.password = await hash("secret");

            await em.save(user);
        }
    });
};

const generateFinishedGames = async () => {
    await connected.manager.transaction(async (em) => {
        for (let i = 0; i < 50; i++) {
            const game = await em.save(GameFactory.default());

            const objectives = ObjectiveFactory.defaultObjectivesForGame(game);

            await em.save(objectives);

            const teams = GameTeamFactory.defaultTeamsForGame(game);

            for (const team of teams) {
                team.completedObjectives.push(...objectives.slice(0, Math.random() * objectives.length));

                await em.save(team);

                const players = PlayerFactory.defaultPlayersForTeam(team);

                for (const player of players) {
                    const user = await em.save(UserFactory.default());
                    const competitor = CompetitorFactory.default();

                    competitor.user = user;
                    player.user = user;

                    await em.save(competitor);
                    await em.save(player);
                }
            }
        }
    });
};

(async () => {
    connected = await Connection;

    await connected.synchronize(true);

    await generateBasicUsers();

    await generateFinishedGames();

    await connected.close();
})();
