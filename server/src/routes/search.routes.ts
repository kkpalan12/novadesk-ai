import { Router } from "express";

import { SearchController } from "../controllers/search.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

import { searchQuerySchema } from "../validators/search.validator";

const router = Router();

const controller = new SearchController();

router.get(
  "/search",
  authenticate,
  validate(searchQuerySchema),
  controller.search,
);

export default router;
