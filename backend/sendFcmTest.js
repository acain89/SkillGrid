// sendFcmTest.js
// Standalone script to send an FCM test notification using Firebase Admin SDK.

import admin from "firebase-admin";
import fs from "fs";

// Load service account
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// --- PUT YOUR DEVICE TOKEN HERE ---
const deviceToken = "f5AFKaxBE2ameEcVxiRfrG:APA91bHksHGg7Iipa7edkYjSDITYOi11NmSKmvpE8hwvSq4VUXCKs-mlo5PUklP1Wp5J_zI9ATcG-O-J6Nm4AB0i-0hsRJuKIPTBhetemnYL_I4dKFisIDY";


// Build message payload
const message = {
  token: deviceToken,
  notification: {
    title: "SkillGrid Test",
    body: "This is a live push notification!",
  },
  webpush: {
    fcmOptions: {
      link: "/home",
    },
  },
};

// Send it
admin
  .messaging()
  .send(message)
  .then((response) => {
    console.log("✅ Message sent successfully:", response);
  })
  .catch((error) => {
    console.error("❌ Error sending message:", error);
  });
