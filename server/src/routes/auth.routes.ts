import { Router } from "express";
import { AuthController} from "../controllers/auth.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator";

const router = Router();
const authController = new AuthController();

router.post(
  "/register",
  validate(registerSchema),
  authController.register
);

router.post(
  "/login",
  validate(loginSchema),
  authController.login
);

router.get(
  "/profile",
  authenticate,
  authController.profile
);

router.post(
    "/refresh",
    authController.refreshToken
);

router.post(
    "/logout",
    authController.logout
);


export default router;