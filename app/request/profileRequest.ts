import { Sex } from '../models/userProfile.model';

export interface Skills {
    html: number;
    css: number;
    js: number;
}

export interface ProfileRequest {
    firstName: string;
    lastName: string;
    dob: Date;
    sex: Sex;
    about: string;
    forHire: boolean;
    company: string;
    websiteUrl: string;
    addressOne: string;
    addressTwo: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    skills: Skills;
}
