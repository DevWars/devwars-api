import { Repository, EntityRepository } from 'typeorm';

import EmailOptIn from '../models/EmailOptIn';
import User from '../models/User';
import * as _ from 'lodash';

@EntityRepository(EmailOptIn)
export default class EmailOptInRepository extends Repository<EmailOptIn> {
    /**
     * Gather the email opt-in permission for a given user.
     * @param user The user who's permissions are being gathered.
     */
    public async getEmailOptInPermissionForUser(user: User): Promise<EmailOptIn> {
        if (_.isNil(user)) return null;
        return await EmailOptIn.findOne({ where: { user: user.id } });
    }
}
