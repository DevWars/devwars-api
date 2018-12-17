import {LinkedAccount, User} from "../models";

export class LinkedAccountRepository {
    public static async forUser(user: User): Promise<LinkedAccount[]> {
        return LinkedAccount.find({where: {user}});
    }
}
