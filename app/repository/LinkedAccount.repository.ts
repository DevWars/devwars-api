import { EntityRepository, Repository, In } from 'typeorm';
import LinkedAccount, { Provider } from '../models/LinkedAccount';

@EntityRepository(LinkedAccount)
export default class LinkedAccountRepository extends Repository<LinkedAccount> {
    public findAllByUserId(userId: number, relations?: string[]): Promise<LinkedAccount[]> {
        return this.find({ where: { user: userId }, relations });
    }

    public findByUserIdAndProvider(userId: number, provider: string, relations?: string[]): Promise<LinkedAccount> {
        return this.findOne({ where: { user: userId, provider: provider.toUpperCase() }, relations });
    }

    public findByProviderAndProviderId(provider: string, providerId: string): Promise<LinkedAccount> {
        return this.findOne({ where: { provider, providerId }, relations: ['user'] });
    }

    public async createMissingAccounts(twitchUsers: any[], provider: Provider): Promise<LinkedAccount[]> {
        const userIds = twitchUsers.map((user) => user.id);
        const existingAccounts = await this.find({ providerId: In(userIds) });

        const newUsers = twitchUsers.filter(
            (user) => !existingAccounts.find((account) => account.providerId === user.id)
        );
        const newAccounts = newUsers.map((user) => new LinkedAccount(null, user.username, provider, user.id));

        return this.save(newAccounts);
    }

    public async findWithPaging({
        first,
        after,
        orderBy = 'createdAt',
        relations = [],
    }: {
        first: number;
        after: number;
        orderBy: string;
        relations?: string[];
    }): Promise<LinkedAccount[]> {
        return this.find({
            skip: after,
            take: first,
            order: {
                [orderBy]: 'DESC',
            },
            relations,
        });
    }
}
