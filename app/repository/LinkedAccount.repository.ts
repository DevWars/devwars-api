import { EntityRepository, Repository, In } from 'typeorm';
import LinkedAccount, { Provider } from '../models/LinkedAccount';
import User from '../models/User';

@EntityRepository(User)
export default class LinkedAccountRepository extends Repository<LinkedAccount> {
    public findAllByUserId(userId: number): Promise<LinkedAccount[]> {
        return LinkedAccount.find({ where: { user: userId }, relations: ['user'] });
    }

    public findByUserIdAndProvider(userId: number, provider: string): Promise<LinkedAccount> {
        return LinkedAccount.findOne({ where: { user: userId, provider }, relations: ['user'] });
    }

    public findByProviderAndProviderId(provider: string, providerId: string): Promise<LinkedAccount> {
        return LinkedAccount.findOne({ where: { provider, providerId }, relations: ['user'] });
    }

    public async createMissingAccounts(twitchUsers: any[], provider: Provider): Promise<LinkedAccount[]> {
        const userIds = twitchUsers.map(user => user.id);
        const existingAccounts = await LinkedAccount.find({ providerId: In(userIds) });

        const newUsers = twitchUsers.filter(user => !existingAccounts.find(account => account.providerId === user.id));
        const newAccounts = newUsers.map(user => new LinkedAccount(null, user.username, provider, user.id));

        return LinkedAccount.save(newAccounts);
    }
}
