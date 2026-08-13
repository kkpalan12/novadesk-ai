import express from "express";
import cors from "cors";
import helmet from "helmet";

import { errorHandler } from "./middlewares/error.middleware";
import routes from "./routes";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { loggerMiddleware } from "./common/logger";
import userRoutes from "./routes/user.routes";
const app = express();

app.use(helmet());

app.use(cors());

app.use(express.json());

app.use(loggerMiddleware);

app.use("/api/v1", routes);
app.use("/api/v1/users", userRoutes);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

export default app;
