// backend/routes/notificationRoutes.js
import express from "express";

const router = express.Router();

/**
 * TEMP: user authentication placeholder.
 * Replace with real auth later.
 */
function getUid(req) {
  // For live tests, we allow passing custom test-ids:
  return req.headers["x-user-id"] || "test-user";
}

/**
 * POST /api/notifications/register
 */
router.post("/register", async (req, res) => {
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ ok: false, error: "Missing token" });
  }

  const uid = getUid(req);
  await saveUserToken(uid, token);

  res.json({ ok: true });
});

export default router;
