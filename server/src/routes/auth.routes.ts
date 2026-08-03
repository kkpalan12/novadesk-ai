import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();
const authController = new AuthController();

router.post("/register", (req, res, next) => {
  authController.register(req, res, next).catch(next);
});

export default router;