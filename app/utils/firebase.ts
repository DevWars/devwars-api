import * as firebase from "firebase-admin";
const serviceAccount = require("../../firebase.json");

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_URL,
});

export const pathValueAtPath = async (path: string, value: any) => {
    return firebase.database().ref(path).set(value);
};
