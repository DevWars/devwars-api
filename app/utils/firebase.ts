import * as dotenv from 'dotenv';
import * as path from 'path';
import * as firebase from 'firebase-admin';
import * as fs from 'fs';

import logger from './logger';
import { canAccessPath, pathExists } from '../../test/helpers';
import { isNil } from 'lodash';

dotenv.config();

// tslint:disable:no-var-requires
const firebasePath = path.resolve(__dirname, '../../firebase.json');

// specified when the firebase application is ready for use but does not ensure that the given
// application is setup and executing correctly. This will only ensure that the environment variable
// and firebase.json file existed.
let available = false;
let firebaseSingleton: firebase.app.App | null = null;

export function initializeFirebase(): firebase.app.App | null {
    if (!isNil(firebaseSingleton)) return firebaseSingleton;

    if (!pathExists(firebasePath)) {
        logger.warn('Firebase service account file does not exist (firebase.json).');
        logger.warn('No firebase functionality until the service account file is provided.');
        return null;
    }

    if (!canAccessPath(firebasePath, fs.constants.R_OK)) {
        logger.warn('Firebase service account file exists but executing user does not have permission to read.');
        logger.warn('No firebase functionality until the service account is readable by the executing user..');
        return null;
    }

    if (isNil(process.env.FIREBASE_URL) || process.env.FIREBASE_URL === '') {
        logger.warn('Firebase database URL environment variable has not been provided.');
        logger.warn('No firebase functionality until the Firebase URL is provided in the environment variables.');
        return null;
    }

    available = true;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serviceAccount = require(firebasePath);

    const firebaseApplication = firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_URL,
    });

    firebaseSingleton = Object.assign(firebaseApplication, { available });
    return firebaseSingleton;
}

export default initializeFirebase();
export { initializeFirebase as firebase, available };
