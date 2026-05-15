import { createContext } from "@DormMatch/api/context";
import { appRouter } from "@DormMatch/api/routers/index";
import { auth } from "@DormMatch/auth";
import { env } from "@DormMatch/env/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";

import { requestLogger } from "./logger";

const app = express();
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const webDistPath = process.env.WEB_DIST_DIR ?? path.resolve(process.cwd(), "apps/web/dist");
const webIndexPath = path.join(webDistPath, "index.html");

app.use(requestLogger);
app.use(express.json());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.all("/api/auth{/*path}", toNodeHandler(auth));

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

if (existsSync(webIndexPath)) {
  app.use(express.static(webDistPath));

  app.get("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/trpc")) {
      next();
      return;
    }

    res.sendFile(webIndexPath);
  });
} else {
  app.get("/", (_req, res) => {
    res.status(200).send("OK");
  });
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
