import * as dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';
import * as firebase from 'firebase-admin';

// tslint:disable:no-var-requires
const firebasePath = path.resolve(__dirname, '../../firebase.json');
const serviceAccount = require(firebasePath);

export default firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_URL,
});

export const pathValueAtPath = async (reference: string, value: any) => {
    return firebase
        .database()
        .ref(reference)
        .set(value);
};

export const getValueAtPath = async (reference: string) => {
    const value = await firebase
        .database()
        .ref(reference)
        .once('value');

    return value.val();
};
