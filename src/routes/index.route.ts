/** @format */

import { Router } from "express";
import { issuesRouter } from "./issues.route";
import { authRouter } from "./auth.route";

const router = Router();

router.use("/issues", issuesRouter);
router.use("/auth", authRouter);

export { router };
