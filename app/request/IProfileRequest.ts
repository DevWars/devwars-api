export interface ISkills {
    html: number;
    css: number;
    js: number;
}

export interface IProfileRequest {
    firstName: string;
    lastName: string;
    dob: Date;
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
    skills: ISkills;
}