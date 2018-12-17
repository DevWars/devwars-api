import {Connection} from "../config/Database";

import {User} from "../app/models";

(async () => {
    try {
        const connection = await Connection;

        const user = await User.createQueryBuilder().addOrderBy("RAND()").getOne();

        console.log(user.username, user.email);
    } catch (e) {
        console.log("Could not fetch user.");
    } finally {
        process.exit();
    }
})();
