import { auth, credential, initializeApp, firestore } from "firebase-admin";

const { GOOGLE_APPLICATION_URL } = process.env;

if (!GOOGLE_APPLICATION_URL) throw new Error("GOOGLE_APPLICATION_URL not set");

const app = initializeApp({
  credential: credential.applicationDefault(),
  databaseURL: this.url,
});

const store = {
  url: process.env.GOOGLE_APPLICATION_URL,
  db: firestore(),
  auth: auth(),
  app,
};

export default store;
