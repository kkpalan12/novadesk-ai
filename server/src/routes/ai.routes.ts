import { Router } from "express";

import { AiController } from "../controllers/ai.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { aiRateLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

const aiController = new AiController();

router.post("/chat", aiRateLimiter, authenticate, aiController.chat);

export default router;
