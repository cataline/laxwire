import {
  auth,
  credential,
  app,
  initializeApp,
  firestore,
} from "firebase-admin";

export default class Store {
  url: string;
  db: firestore.Firestore;
  auth: auth.Auth;
  app: app.App;

  constructor() {
    this.url = process.env.GOOGLE_APPLICATION_URL as string;

    this.app = initializeApp({
      credential: credential.applicationDefault(),
      databaseURL: this.url,
    });

    this.db = firestore();
    this.auth = auth();
  }

  async linkBots() {}
}
