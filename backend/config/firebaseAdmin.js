// backend/config/firebaseAdmin.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust if your key file is in a different path
const servicePath = path.join(__dirname, "..", "serviceAccountKey.json");

if (!admin.apps.length) {
  const serviceAccountJson = fs.readFileSync(servicePath, "utf8");
  const serviceAccount = JSON.parse(serviceAccountJson);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
