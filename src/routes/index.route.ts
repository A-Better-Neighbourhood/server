/** @format */

import { Router } from "express";
import { issuesRouter } from "./issues.route";
import { authRouter } from "./auth.route";
import { internalRouter } from "./internal.route";

const router = Router();

router.use("/issues", issuesRouter);
router.use("/auth", authRouter);
router.use("/internal", internalRouter);

export { router };
