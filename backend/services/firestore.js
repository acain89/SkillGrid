// backend/services/firestore.js
//
// Initializes Firebase Admin SDK for backend Firestore access.
// Used for: push logs, tournament persistence, XP awards, etc.
//

import admin from "firebase-admin";
import fs from "fs";

let app;

// Try to reuse existing app instance
if (!admin.apps.length) {
  // Load service account key
  const serviceKeyPath = "./serviceAccountKey.json";

  if (!fs.existsSync(serviceKeyPath)) {
    console.error(
      "\n❌ Missing serviceAccountKey.json in backend root.\n" +
        "Download it from Firebase Console → Project Settings → Service Accounts.\n"
    );
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath));

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  app = admin.app();
}

export const db = admin.firestore();
