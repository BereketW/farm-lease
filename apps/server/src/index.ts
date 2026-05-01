import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { initIO } from "./realtime/io";
import { ensureDevMockClusters } from "./lib/dev-seed";
import { UPLOAD_ROOT } from "./lib/storage";
import { startAgreementLifecycleJob } from "./jobs/agreement-lifecycle";
import notificationsRouter from "./modules/notifications/routes";
import clustersRouter from "./modules/clusters/routes";
import proposalsRouter from "./modules/proposals/routes";
import usersRouter from "./modules/users/routes";
import uploadsRouter from "./modules/uploads/routes";
import agreementsRouter from "./modules/agreements/routes";
import receiptsRouter from "./modules/receipts/routes";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(helmet());
app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3001",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-dev-user-id"],
  })
);
app.use(express.json());

// Serve uploaded files (dev-friendly; swap for Cloudinary/S3 in prod)
app.use(
  "/uploads",
  express.static(UPLOAD_ROOT, {
    setHeaders: (res) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

app.use("/api/notifications", notificationsRouter);
app.use("/api/clusters", clustersRouter);
app.use("/api/proposals", proposalsRouter);
app.use("/api/agreements", agreementsRouter);
app.use("/api/receipts", receiptsRouter);
app.use("/api/users", usersRouter);
app.use("/api/uploads", uploadsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const httpServer = http.createServer(app);
initIO(httpServer);

httpServer.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
  void ensureDevMockClusters().catch((error) => {
    console.warn("[dev-seed] failed", error);
  });
  startAgreementLifecycleJob();
});
