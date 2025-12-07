// backend/firebaseAdmin.js
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

/*
  You have two main options for credentials:

  1) GOOGLE_APPLICATION_CREDENTIALS env var pointing to a JSON file
     - process.env.GOOGLE_APPLICATION_CREDENTIALS = "C:\\path\\to\\serviceAccount.json"
     - In Render, you set this as an env var and upload the JSON in some secure way.

  2) Put the service account JSON into an env var and parse it here.

  For now, we'll use the standard "applicationDefault" approach.
*/

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

export { admin, db };
