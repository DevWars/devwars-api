import User from '../app/models/User';
import { AuthService } from '../app/services/Auth.service';

export const cookieForUser = async (user: User): Promise<string> => {
    return `token=${await AuthService.newToken(user)}`;
};
