import { Repository, EntityRepository } from 'typeorm';

import EmailOptIn from '../models/emailOptIn.model';
import User from '../models/user.model';

@EntityRepository(EmailOptIn)
export default class EmailOptInRepository extends Repository<EmailOptIn> {
    /**
     * Gather the email opt-in permission for a given user.
     * @param user The user who's permissions are being gathered.
     */
    public async getEmailOptInPermissionForUser(user: User): Promise<EmailOptIn> {
        return await this.findOne({ where: { user } });
    }
}
