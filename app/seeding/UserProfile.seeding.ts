import { name, date, random, lorem, helpers, internet, address, company } from 'faker';
import UserProfile, { Sex } from '../models/UserProfile';

export default class UserProfileSeeding {
    public static default(): UserProfile {
        const profile = new UserProfile();

        profile.firstName = name.firstName();
        profile.lastName = name.lastName();
        profile.dob = date.past(50);
        profile.sex = helpers.randomize([Sex.MALE, Sex.FEMALE, Sex.OTHER]);
        profile.about = lorem.paragraphs(5);
        profile.forHire = random.boolean();
        profile.company = company.companyName();
        profile.websiteUrl = internet.url();
        profile.addressOne = address.streetAddress();
        profile.addressTwo = address.secondaryAddress();
        profile.city = address.city();
        profile.state = address.state();
        profile.zip = address.zipCode();
        profile.country = address.country();
        profile.skills = {
            css: random.number({ min: 1, max: 5 }),
            html: random.number({ min: 1, max: 5 }),
            js: random.number({ min: 1, max: 5 }),
        };

        return profile;
    }

    public static withUser(user: any) {
        const profile = this.default();

        profile.user = user;

        return profile;
    }
}
