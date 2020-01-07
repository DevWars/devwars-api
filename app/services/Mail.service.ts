// tslint:disable no-var-requires
import * as fs from 'fs';
import * as path from 'path';
import * as createMailgun from 'mailgun-js';
import { getCustomRepository } from 'typeorm';

import GameApplication from '../models/GameApplication';
import User from '../models/User';
import LinkedAccount from '../models/LinkedAccount';

import EmailRepository from '../repository/EmailOptIn.repository';
import logger from '../utils/logger';

const mjml2html = require('mjml');
const mjmlOptions = { minify: true, keepComments: false };

export async function send(to: string, subject: string, html: string) {
    // We don't care about anything going on in testing, so just return out early before we attempt
    // to send anymore emails.
    if (process.env.NODE_ENV === 'test') return;

    // If we are in development of the application, we would want to look to log out the details as
    // these could be used for testing validation links, and email information in development.
    if (process.env.NODE_ENV === 'development') return logger.info(`to: ${to}, subject: ${subject}, html: ${html}`);

    try {
        const mailgun = createMailgun({ apiKey: process.env.MAILGUN_KEY, domain: 'devwars.tv' });

        mailgun.messages().send({
            from: 'DevWars <noreply@devwars.tv>',
            to,
            subject,
            html,
        });
    } catch (error) {
        logger.error(`error sending an email, ${error}`);
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

/**
 * Sends the game application applying email to the given user, this email describes
 * the game they are applying to with basic information about the event.
 * @param gameApplication The game application related to the email being sent.
 */
export async function sendGameApplicationApplyingEmail(gameApplication: GameApplication) {
    const emailRepository = getCustomRepository(EmailRepository);
    const emailPermissions = await emailRepository.getEmailOptInPermissionForUser(gameApplication.user);

    if (!emailPermissions.gameApplications) {
        const { username } = gameApplication.user;
        return logger.verbose(`game application email skipped for ${username} due to permissions.`);
    }

    const subject = 'DevWars Game Application';

    const filePath = path.resolve(__dirname, '../mail/game-application.mjml');
    const template = fs.readFileSync(filePath).toString();
    const output = mjml2html(template, { ...mjmlOptions, filePath });

    // prettier-ignore
    output.html = output.html
        .replace(/__USERNAME__/g, gameApplication.user.username)
        .replace(/__GAME_TIME__/g, gameApplication.schedule.startTime.toUTCString())
        .replace(/__GAME_MODE__/g, `${gameApplication.schedule.setup.mode || 'specified'}`);

    await send(gameApplication.user.email, subject, output.html);
}

/**
 * Sends the game application resigning email to the given user, this email describes
 * the game they are  resigning to with basic information about the event.
 * @param gameApplication The game application related to the email being sent.
 */
export async function SendGameApplicationResignEmail(gameApplication: GameApplication) {
    const emailRepository = getCustomRepository(EmailRepository);
    const emailPermissions = await emailRepository.getEmailOptInPermissionForUser(gameApplication.user);

    if (!emailPermissions.gameApplications) {
        const { username } = gameApplication.user;
        return logger.verbose(`game application resign email skipped for ${username} due to permissions.`);
    }

    const subject = 'DevWars Game Application Update (Resign)';

    const filePath = path.resolve(__dirname, '../mail/game-application-resign.mjml');
    const template = fs.readFileSync(filePath).toString();
    const output = mjml2html(template, { ...mjmlOptions, filePath });

    // prettier-ignore
    output.html = output.html
        .replace(/__USERNAME__/g, gameApplication.user.username)
        .replace(/__GAME_TIME__/g, gameApplication.schedule.startTime.toUTCString())
        .replace(/__GAME_MODE__/g, `${gameApplication.schedule.setup.mode || 'specified'}`);

    await send(gameApplication.user.email, subject, output.html);
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

export async function sendContactUsEmail(name: string, email: string, message: string) {
    const subject = `DevWars Contact Us - ${name}`;

    const filePath = path.resolve(__dirname, '../mail/contact-us.mjml');
    const template = fs.readFileSync(filePath).toString();
    const output = mjml2html(template, { ...mjmlOptions, filePath });

    // prettier-ignore
    output.html = output.html
        .replace(/__NAME__/g, name)
        .replace(/__EMAIL__/g, email)
        .replace(/__MESSAGE__/g, message);

    await send('contact@devwars.tv', subject, output.html);
    await send(email, subject, output.html);
}
/**
 * Send a email to th linked account user about the account status change (linked).
 * @param user The user who has unlinked a connection from there account.
 * @param provider The provider who was unlinked.
 */
export async function SendLinkedAccountEmail(user: User, provider: string) {
    const emailRepository = getCustomRepository(EmailRepository);
    const emailPermissions = await emailRepository.getEmailOptInPermissionForUser(user);

    if (!emailPermissions?.linkedAccounts) {
        return logger.verbose(`linked account email skipped for ${user.username} due to permissions.`);
    }

    const subject = 'DevWars Linked Account Update';

    const filePath = path.resolve(__dirname, '../mail/linked-account.mjml');
    const template = fs.readFileSync(filePath).toString();
    const output = mjml2html(template, { ...mjmlOptions, filePath });

    // prettier-ignore
    output.html = output.html
        .replace(/__USERNAME__/g, user.username)
        .replace(/__PROVIDER__/g, `${provider[0].toUpperCase()}${provider.toLowerCase().slice(1)}`)
        .replace(/__URL__/g, `${process.env.FRONT_URL}/settings/connections`);

    await send(user.email, subject, output.html);
}

/**
 *
 *  Send a email to the linked account user about the account status change (unlinked).
 *
 * @param user The user who has unlinked a connection from there account.
 * @param provider The provider who was unlinked.
 */
export async function SendUnLinkedAccountEmail(user: User, provider: string) {
    const emailRepository = getCustomRepository(EmailRepository);
    const emailPermissions = await emailRepository.getEmailOptInPermissionForUser(user);

    if (!emailPermissions.linkedAccounts) {
        const { username } = user;
        return logger.verbose(`unlinked account email skipped for ${username} due to permissions.`);
    }

    const subject = 'DevWars Linked Account Update (Unlinked)';

    const filePath = path.resolve(__dirname, '../mail/linked-account-disconnect.mjml');
    const template = fs.readFileSync(filePath).toString();
    const output = mjml2html(template, { ...mjmlOptions, filePath });

    // prettier-ignore
    output.html = output.html
        .replace(/__USERNAME__/g, user.username)
        .replace(/__PROVIDER__/g, `${provider[0].toUpperCase()}${provider.toLowerCase().slice(1)}`)
        .replace(/__URL__/g, `${process.env.FRONT_URL}/settings/connections`);

    await send(user.email, subject, output.html);
}
