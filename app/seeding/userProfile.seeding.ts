import * as faker from 'faker';
import UserProfile, { Sex } from '../models/userProfile.model';

export default class UserProfileSeeding {
    public static default(): UserProfile {
        const profile = new UserProfile();

        profile.firstName = faker.name.firstName();
        profile.lastName = faker.name.lastName();
        profile.dob = faker.date.past(50);
        profile.sex = faker.helpers.randomize([Sex.MALE, Sex.FEMALE, Sex.OTHER]);
        profile.about = faker.lorem.paragraphs(5);
        profile.forHire = faker.datatype.boolean();
        profile.company = faker.company.companyName();
        profile.websiteUrl = faker.internet.url();
        profile.addressOne = faker.address.streetAddress();
        profile.addressTwo = faker.address.secondaryAddress();
        profile.city = faker.address.city();
        profile.state = faker.address.state();
        profile.zip = faker.address.zipCode();
        profile.country = faker.address.country();
        profile.skills = {
            css: faker.datatype.number({ min: 1, max: 5 }),
            html: faker.datatype.number({ min: 1, max: 5 }),
            js: faker.datatype.number({ min: 1, max: 5 }),
        };

        return profile;
    }

    public static withUser(user: any) {
        const profile = this.default();

        profile.user = user;

        return profile;
    }
}
