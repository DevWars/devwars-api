// tslint:disable no-var-requires
import * as fs from 'fs';
import * as path from 'path';
import * as createMailgun from 'mailgun-js';
const mjml2html = require('mjml');

import User from '../models/User';

const mjmlOptions = { minify: true, keepComments: false };

export async function send(to: string, subject: string, html: string) {
    // We don't care about anything going on in testing, so just return out early before we attempt
    // to send anymore emails.
    if (process.env.NODE_ENV === 'test') return;

    // If we are in development of the application, we would want to look to log out the details as
    // these could be used for testing validation links, and email information in development.
    if (process.env.NODE_ENV === 'development') return console.log({ to, subject, html });

    try {
        const mailgun = createMailgun({ apiKey: process.env.MAILGUN_KEY, domain: 'devwars.tv' });

        mailgun.messages().send({
            from: 'DevWars <noreply@devwars.tv>',
            to,
            subject,
            html,
        });
    } catch (e) {
        console.error(e);
    }
}

export async function sendWelcomeEmail(user: User, verificationUrl: string) {
    const subject = 'Welcome to DevWars';

    const filePath = path.resolve(__dirname, '../mail/welcome.mjml');
    const template = fs.readFileSync(filePath).toString();
    const output = mjml2html(template, { ...mjmlOptions, filePath });

    // prettier-ignore
    output.html = output.html
        .replace(/__USERNAME__/g, user.username)
        .replace(/__URL__/g, verificationUrl);

    await send(user.email, subject, output.html);
}

export async function sendPasswordResetEmail(user: User, resetUrl: string) {
    const subject = 'DevWars Password Reset';

    const filePath = path.resolve(__dirname, '../mail/reset-password.mjml');
    const template = fs.readFileSync(filePath).toString();
    const output = mjml2html(template, { ...mjmlOptions, filePath });

    // prettier-ignore
    output.html = output.html
        .replace(/__USERNAME__/g, user.username)
        .replace(/__URL__/g, resetUrl);

    await send(user.email, subject, output.html);
}
