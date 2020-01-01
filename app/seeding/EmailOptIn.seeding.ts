import { random } from 'faker';
import EmailOptIn from '../models/EmailOptIn';
import User from '../models/User';

export default class EmailOptInSeeding {
    public static default(user?: User): EmailOptIn {
        return new EmailOptIn(user, random.boolean(), random.boolean(), random.boolean(), random.boolean());
    }
}
