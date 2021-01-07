// tslint:disable no-var-requires
import * as fs from 'fs/promises';
import * as path from 'path';
import * as createMailgun from 'mailgun-js';
import { getCustomRepository } from 'typeorm';
import GameApplication from '../models/gameApplication.model';
import User from '../models/user.model';

import EmailRepository from '../repository/emailOptIn.repository';
import logger from '../utils/logger';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mjml2html = require('mjml');

async function renderTemplate(fileName: string): Promise<any> {
    const filePath = path.resolve(__dirname, '../../templates', fileName);
    const template = (await fs.readFile(filePath)).toString();

    return mjml2html(template, { minify: true, keepComments: false, filePath });
}

export async function send(to: string, subject: string, html: string): Promise<any> {
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

export async function sendWelcomeEmail(user: User, verificationUrl: string): Promise<void> {
    const subject = 'Welcome to DevWars';
    const output = await renderTemplate('welcome.mjml');

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
export async function sendGameApplicationApplyingEmail(gameApplication: GameApplication): Promise<any> {
    const emailRepository = getCustomRepository(EmailRepository);
    const emailPermissions = await emailRepository.getEmailOptInPermissionForUser(gameApplication.user);

    if (!emailPermissions.gameApplications) {
        const { username } = gameApplication.user;
        return logger.verbose(`game application email skipped for ${username} due to permissions.`);
    }

    const subject = 'DevWars Game Application';
    const output = await renderTemplate('game-application.mjml');

    // prettier-ignore
    output.html = output.html
        .replace(/__USERNAME__/g, gameApplication.user.username)
        .replace(/__GAME_TIME__/g, gameApplication.game.startTime.toUTCString())
        .replace(/__GAME_MODE__/g, `${gameApplication.game.mode || 'specified'}`);

    await send(gameApplication.user.email, subject, output.html);
}

/**
 * Sends the game application resigning email to the given user, this email describes
 * the game they are  resigning to with basic information about the event.
 * @param gameApplication The game application related to the email being sent.
 */
export async function SendGameApplicationResignEmail(gameApplication: GameApplication): Promise<any> {
    const emailRepository = getCustomRepository(EmailRepository);
    const emailPermissions = await emailRepository.getEmailOptInPermissionForUser(gameApplication.user);

    if (!emailPermissions.gameApplications) {
        const { username } = gameApplication.user;
        return logger.verbose(`game application resign email skipped for ${username} due to permissions.`);
    }

    const subject = 'DevWars Game Application Update (Resign)';
    const output = await renderTemplate('game-application-resign.mjml');

    // prettier-ignore
    output.html = output.html
        .replace(/__USERNAME__/g, gameApplication.user.username)
        .replace(/__GAME_TIME__/g, gameApplication.game.startTime.toUTCString())
        .replace(/__GAME_MODE__/g, `${gameApplication.game.mode || 'specified'}`);

    await send(gameApplication.user.email, subject, output.html);
}

export async function sendPasswordResetEmail(user: User, resetUrl: string) {
    const subject = 'DevWars Password Reset';

    const output = await renderTemplate('reset-password.mjml');

    // prettier-ignore
    output.html = output.html
        .replace(/__USERNAME__/g, user.username)
        .replace(/__URL__/g, resetUrl);

    await send(user.email, subject, output.html);
}

export async function sendContactUsEmail(name: string, email: string, message: string): Promise<void> {
    const subject = `DevWars Contact Us - ${name}`;
    const output = await renderTemplate('contact-us.mjml');

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
export async function SendLinkedAccountEmail(user: User, provider: string): Promise<any> {
    const emailRepository = getCustomRepository(EmailRepository);
    const emailPermissions = await emailRepository.getEmailOptInPermissionForUser(user);

    if (!emailPermissions?.linkedAccounts) {
        return logger.verbose(`linked account email skipped for ${user.username} due to permissions.`);
    }

    const subject = 'DevWars Linked Account Update';
    const output = await renderTemplate('linked-account.mjml');

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
export async function SendUnLinkedAccountEmail(user: User, provider: string): Promise<any> {
    const emailRepository = getCustomRepository(EmailRepository);
    const emailPermissions = await emailRepository.getEmailOptInPermissionForUser(user);

    if (!emailPermissions.linkedAccounts) {
        const { username } = user;
        return logger.verbose(`unlinked account email skipped for ${username} due to permissions.`);
    }

    const subject = 'DevWars Linked Account Update (Unlinked)';
    const output = await renderTemplate('linked-account-disconnect.mjml');

    // prettier-ignore
    output.html = output.html
        .replace(/__USERNAME__/g, user.username)
        .replace(/__PROVIDER__/g, `${provider[0].toUpperCase()}${provider.toLowerCase().slice(1)}`)
        .replace(/__URL__/g, `${process.env.FRONT_URL}/settings/connections`);

    await send(user.email, subject, output.html);
}
