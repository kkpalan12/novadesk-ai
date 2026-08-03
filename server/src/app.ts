import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import healthRoutes from "./routes/health.routes";
import { errorHandler } from "./middlewares/error.middleware";
import routes from "./routes";

const app = express();

app.use(helmet());

app.use(cors());

app.use(express.json());

app.use(morgan("dev"));

app.use("/api/v1", routes);

app.use(errorHandler);

export default app;