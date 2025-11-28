/** @format */

import { Router } from "express";
import { reportsRouter } from "./reports.route";
import { authRouter } from "./auth.route";
import express from "express";
import path from "path";

const router = Router();

router.use("/reports", reportsRouter);
router.use("/auth", authRouter);

// Debug route to serve model analysis results
if (process.env.NODE_ENV !== "production") {
  router.use(
    "/debug/model-results",
    express.static(path.join(process.cwd(), "uploads", "model-results"))
  );
}

export { router };
