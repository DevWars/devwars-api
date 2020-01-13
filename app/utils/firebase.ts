import * as dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';
import * as firebase from 'firebase-admin';
import * as fs from 'fs';

import logger from './logger';
import { fileExists, canAccessFile } from '../../test/helpers';
import { isNil } from 'lodash';

// tslint:disable:no-var-requires
const firebasePath = path.resolve(__dirname, '../../firebase.json');
const serviceAccount = require(firebasePath);

function initializeFirebase(): firebase.app.App | null {
    if (!fileExists(firebasePath)) {
        const warning =
            'Firebase service account file does not exist. ' +
            'Limited functionality until service account is provided.';

        logger.warn(warning);
        return null;
    }

    if (!canAccessFile(firebasePath, fs.constants.R_OK)) {
        const warning =
            'Firebase service account file exists but. executing user does not have permission to read.' +
            'Limited functionality until service account is readable.';

        logger.warn(warning);
        return null;
    }

    if (isNil(process.env.FIREBASE_URL) || process.env.FIREBASE_URL === '') {
        const warning =
            'Firebase database url service account has not been provided.' +
            'Limited functionality firebase url is provided in the environment variables.';

        logger.warn(warning);
        return null;
    }

    return firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_URL,
    });
}

export default initializeFirebase();
