import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "skillgrid-backend",
    time: new Date().toISOString()
  });
});

export default router;
