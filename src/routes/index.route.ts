/** @format */

import { Router } from "express";
import { issuesRouter } from "./issues.route.js";

const router = Router();

router.use("/issues", issuesRouter);

export { router };
