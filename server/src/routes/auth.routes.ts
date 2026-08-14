import { Router } from "express";

import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { authRateLimiter } from "../middlewares/rate-limit.middleware";

import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  logoutSchema,
} from "../validators/auth.validator";

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User Authentication APIs
 */

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */

router.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  authController.register,
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */

router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  authController.login,
);

router.post(
  "/forgot-password",
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  authRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get logged in user
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 */

router.get("/me", authenticate, authController.profile);

router.post(
  "/refresh",
  authRateLimiter,
  validate(refreshTokenSchema, { statusCode: 401 }),
  authController.refreshToken,
);

router.post(
  "/logout",
  validate(logoutSchema, { statusCode: 401 }),
  authController.logout,
);

export default router;
