/** @format */

import { Router } from "express";
import { reportsRouter } from "./reports.route";
import { authRouter } from "./auth.route";

const router = Router();

router.use("/reports", reportsRouter);
router.use("/auth", authRouter);

export { router };
