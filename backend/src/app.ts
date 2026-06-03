import cors from "cors";
import express from "express";
import path from "node:path";

import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { apiRouter } from "./routes";

export const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientUrls.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "employee-performance-backend",
    environment: env.nodeEnv
  });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
