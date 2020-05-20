import { random } from 'faker';
import EmailOptIn from '../models/emailOptIn.model';
import User from '../models/user.model';

export default class EmailOptInSeeding {
    public static default(user?: User): EmailOptIn {
        return new EmailOptIn(user, random.boolean(), random.boolean(), random.boolean(), random.boolean());
    }
}
