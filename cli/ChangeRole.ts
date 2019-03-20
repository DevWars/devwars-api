import { Connection } from '../config/Database';

import { UserRole } from '../app/models/User';
import UserRepository from '../app/repository/User.repository';

(async () => {
    try {
        await Connection;

        const user = await UserRepository.byUsername(process.argv[2]);

        user.role = (UserRole as any)[process.argv[3]];

        await user.save();

        console.log(user.role);

        console.log(`Saved user with id ${user.id}`);
    } catch (e) {
        console.log('Could not fetch user.');
    } finally {
        process.exit();
    }
})();
